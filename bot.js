let djs = require("discord.js");
let fs = require("fs");
let priv = require("./priv.js");
let util = require("./utils/util.js");
let conf = require("./conf.js");
let data;

let cli = new djs.Client();
let commandsAwaiting = {};
let commands = [];
let memberActivity = {};

if(!global.db){
	let { MongoClient } = require("mongodb");

	MongoClient.connect(priv.mongo, { useUnifiedTopology: true, useNewUrlParser: true }, (err, cli) => {
		if(err)
			return process.exit(console.log("Failed to get database") || 1);
		global.db = cli.db("main_db");
		data = require("./utils/data.js");
		initCommands();
	})
}

function initCommands(){
	fs.readdir("./rsbot/commands/", (_, files)=>{
		for(let file of files)
			try { registerCommand(require("./commands/" + file), file); }
			catch(e) { console.log(`error loading command file ${file}: \n${e}`); }
	});
}
function registerCommand(cmd, file){
	if(!cmd.data.name || !cmd.run)
		return console.log(`error loading command file ${file}: \nmissing name and or main func`);
	if(!cmd.data.alias)
		cmd.data.alias = [];
	if(!cmd.data.allowedChannels)
		cmd.data.allowedChannels = [];
	if(!cmd.data.description)
		cmd.data.description = "";
		
	
	cmd.data.name = cmd.data.name.toLowerCase();
	commands.push(cmd);
}
async function handleGameReact(){
	let channel = await cli.channels.fetch(conf.channels.gamerole);
	let guild = await cli.guilds.fetch(conf.guild);
	let msg = (await channel.messages.fetch({ limit: 5 })).filter(msg => msg.author.id == cli.user.id).first();
	if(!msg){
		msg = await channel.send(util.getBaseEmbed("React to receive the \"Game\" role", "Members of the Discord can mention this role whenever players are needed for a game!"))
		msg.react(conf.blobEmoji);
	}
	cli.on("messageReactionAdd", async (msgRct, user) => {
		if(!user.bot && msgRct.message == msg && msgRct.emoji.id == conf.blobEmoji){
			let memb = await guild.members.fetch(user);
			memb.roles.add(conf.roles.game);
		}
	})
	cli.on("messageReactionRemove", async (msgRct, user) => {
		if(!user.bot && msgRct.message == msg && msgRct.emoji.id == conf.blobEmoji){
			let memb = await guild.members.fetch(user);
			memb.roles.remove(conf.roles.game);
		}
	})
	console.log("React role loaded");
}
async function handleLiveServers(){
	let channel = await cli.channels.fetch(conf.channels.servers);
	let guild = await cli.guilds.fetch(conf.guild);
	let msg = (await channel.messages.fetch({ limit: 5 })).filter(msg => msg.author.id == cli.user.id).first();
	function getServFields(){
		let fields = [];
		for(let key in servers){
			let serv = servers[key];
			let field = [];
			
			let ct = `\n🔎 ${serv.players.map(n=>n[0]).join(", ")} (${serv.players.length} / 10 players)`;
			let lastW = `\n🥇 ${serv.lastWon || "No winner"}`;
			let mode = serv.gamemode == "Empire" ? "⚔" : "👑";

			field[0] = `🖥 **Server ${serv.id.toUpperCase()} - ${serv.isVip ? "VIP" : "PUBLIC"}**`;
			field[1] = `${mode} ${serv.gamemode}\n🕓 ${serv.elapsedTime} - ${serv.stage} Stage ${ct}${lastW}`;

			fields.push(field);
		}
		return fields;
	}
	if(!msg){
		msg = await channel.send(util.getBaseEmbed(":clipboard: Risky Strats Servers", "A list of information about currently active servers. Refreshes every 15 seconds.", "succ", getServFields()));
	}
	setInterval(()=>{
		msg.edit(
			util.getBaseEmbed(":clipboard: Risky Strats Servers", "A list of information about currently active servers. Refreshes every 15 seconds.", "succ", getServFields()).setTimestamp(new Date().getTime())
		);
	},15000)
	console.log("Live servers loaded");
}
function addToAwaiting(m, data){
	commandsAwaiting[m.author.id] = data;
}

cli.on("message", m => {
	//if(m.channel.id == conf.channels.admin) return;
	if(commands.length == 0) return;
	if(!m.content.startsWith(conf.prefix) && !commandsAwaiting[m.author.id]){
		memberActivity[m.author.id] = true;
		return;
	}
		
	let args = m.content.split(" ");
	let ucmd = args.splice(0, 1)[0].slice(conf.prefix.length, 2000).toLowerCase();
	
	if(commandsAwaiting[m.author.id]){
		let info = commandsAwaiting[m.author.id];
		if((new Date().getTime() / 1000 - info.started / 1000) < info.timeout){
			let ret = info.func(m, m.content.split(" "), addToAwaiting);
			if(ret)
				commandsAwaiting[m.author.id] = ret;
			else
				delete commandsAwaiting[m.author.id];
		}else{
			if(info.timeoutFunc)
				info.timeoutFunc();
			delete commandsAwaiting[m.author.id];
		}
		return;
	}
	
	for(let cmd of commands)
		if(cmd.data.name == ucmd || cmd.data.alias.includes(ucmd))
			if(cmd.data.allowedChannels.length == 0 || cmd.data.allowedChannels.includes(m.channel.id))
				commandsAwaiting[m.author.id] = cmd.run(m, args, addToAwaiting, commands);
});

cli.on("ready", async ()=>{
	let guild = await cli.guilds.fetch(conf.guild);
	guild.members.fetch();
	console.log("Bot logged in & guild registered");
	handleGameReact();
	if(global.servers)
		handleLiveServers();
});

cli.on("guildMemberAdd", m => {
	if(m.guild.id == "239575558147670018"){
		m.roles.add(m.guild.roles.cache.get("812375598278246400"));
		cli.channels.cache.get("812376751438430308").send(`<@${m.id}>`,
			util.getBaseEmbed(`Welcome ${m.displayName}!`, "Verify with the \"!verify\" command to gain additional permissions and channel access!")
		);
	}
});

setInterval(async () => { // handle awaiting command cleanup & member activity updating
	for(let id in commandsAwaiting){
		let info = commandsAwaiting[id];
		if(!info) continue;
		if((new Date().getTime() / 1000 - info.started / 1000) > info.timeout){
			if(info.timeoutFunc)
				info.timeoutFunc();
			delete commandsAwaiting[id];
		}
	}

	let monthN = new Date().getUTCMonth();
	let guild = await cli.guilds.fetch(conf.guild);
	for(let uid in memberActivity){
		let udata = await data.get("userdata", uid);
		console.log("active update",uid,udata);
		if(!udata){
			delete memberActivity[uid];
			continue;
		}
		let memb = await guild.members.fetch(uid);
		let activity = udata.activity;
		
		if(activity.totalMsgs) activity.totalMsgs += 1;
		else activity.totalMsgs = 1;
		
		activity.totalMsgs = Math.min(activity.totalMsgs, conf.activeMemMsgs * 3); // don't let people accumulate more than 1200 messages, since 1200 messages = 3 months of active member

		if(activity.currentMonth === undefined) activity.currentMonth = monthN;
		if(activity.currentMonth != monthN){ // a month has passed, determine if they receive role
			if(activity.totalMsgs >= conf.activeMemMsgs)
				memb.roles.add(conf.roles.active);
			else
				memb.roles.remove(conf.roles.active); // what happens when you try to remove a role they dont have? who knows lets find out

			activity.totalMsgs = Math.max(activity.totalMsgs - conf.activeMemMsgs, 0); // if 800 messages were sent that month, only take 400 away and let the rest carry over 
		}
		if(activity.currentMonth == monthN && activity.totalMsgs == conf.activeMemMsgs)
			memb.roles.add(conf.roles.active);
		
		delete memberActivity[uid];
		activity.currentMonth = monthN;

		data.update("userdata", uid, "activity", activity);
	}
}, 10000);

setInterval(async () => { // handle old active member role removing
	let guild = await cli.guilds.fetch(conf.guild);
	let role = await guild.roles.fetch(conf.roles.active);
	let monthN = new Date().getUTCMonth();
	role.members.map(async memb => {
		let udata = await data.get("userdata", memb.id);
		if(!udata) return;
		let activity = udata.activity;
		let changed;
		if(activity.currentMonth != monthN){ // they are currently an active member, the month has changed, remove their messages and check
			if(activity.totalMsgs >= 400)
				memb.roles.add(conf.roles.active);
			else
				memb.roles.remove(conf.roles.active);

			activity.totalMsgs = Math.max(activity.totalMsgs - 400, 0);
			changed = true;
			activity.currentMonth = monthN;
		}
		if(changed)
			data.update("userdata", memb.id, "activity", activity);
	});
}, 60000 * 5);

cli.login(priv.token);

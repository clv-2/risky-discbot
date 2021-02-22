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
	let mongo = require("mongodb");

	mongo.MongoClient.connect(priv.mongo, { useUnifiedTopology: true }, (err, cli) => {
		if(err)
			return process.exit(console.log("Failed to get database") || 1);
		global.db = cli.db('main_db');
		data = data = require("./utils/data.js");
		initCommands();
	})
}

function initCommands(){
	fs.readdir("./commands/", (_,files)=>{
		files.forEach(file=>{
			try{
				commands.push(require("./commands/"+file));
				console.log("registered", commands[commands.length-1]);
			}catch(e){
				console.log("error loading command file "+file,"\n",e);
			}
		})
	});
}

function addToAwaiting(m, data){
	commandsAwaiting[m.author.id] = data;
}

cli.on("message", m=>{
	if(m.author.id != "250329235497943040" && m.author.id != "250329851410644993") return;
	if(m.channel.id != "659219861393637377" && m.channel.id != "812376751438430308" && m.channel.id != "330456925181444106") return;
	if(commands.length == 0) return;
	if(!m.content.startsWith(conf.prefix) && !commandsAwaiting[m.author.id]){
		memberActivity[m.author.id] = true;
		return;
	}
		
	let args = m.content.split(" ");
	let ucmd = args.splice(0,1)[0].slice(conf.prefix.length, 2000);
	
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
	
	commands.forEach(cmd=>{
		if(cmd.data.name.toLowerCase() == ucmd.toLowerCase())
			commandsAwaiting[m.author.id] = cmd.run(m, args, addToAwaiting);
	});
});

cli.on("ready", async ()=>{
	let guild = await cli.guilds.fetch(conf.guild);
	guild.members.fetch(); // caches all members
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
		if(!udata) return;
		let memb = await guild.members.fetch(uid);
		let activity = udata.activity;
		
		if(activity.totalMsgs) activity.totalMsgs += 1;
		else activity.totalMsgs = 1;
		
		activity.totalMsgs = Math.min(activity.totalMsgs, 1200); // don't let people accumulate more than 1200 messages, since 1200 messages = 3 months of active member

		if(activity.currentMonth === undefined) activity.currentMonth = monthN;
		if(activity.currentMonth != monthN){ // a month has passed, determine if they receive role
			if(activity.totalMsgs >= 400)
				memb.roles.add(conf.roles.active);
			else
				memb.roles.remove(conf.roles.active); // what happens when you try to remove a role they dont have? who knows lets find out

			activity.totalMsgs = Math.max(activity.totalMsgs - 400, 0); // if 800 messages were sent that month, only take 400 away and let the rest carry over 
		}
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
		if(memb.id != "250329235497943040" && memb.id != "250329851410644993") return;
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
}, 10000);

cli.login(priv.token);

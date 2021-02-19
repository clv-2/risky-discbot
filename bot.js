let priv = require("./priv.js");
let djs = require("discord.js");
let util = require("./utils/util.js");
let cli = new  djs.Client();
let fs = require("fs");
let prefix = "!";

if(!global.db){
	let mongo = require("mongodb");

	mongo.MongoClient.connect(priv.mongo, { useUnifiedTopology: true }, (err, cli) => {
		if(err)
			return process.exit(console.log("Failed to get database") || 1);
		global.db = cli.db('main_db');;
		loadCmds();
	})
}

let commandsAwaiting = {};
let cmds = [];
function loadCmds(){
	fs.readdir("./commands/", (_,files)=>{
		files.forEach(file=>{
			try{
				cmds.push(require("./commands/"+file));
				console.log("registered", cmds[cmds.length-1]);
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
	if(m.channel.id != "659219861393637377" && m.channel.id != "812376751438430308" && m.channel.id != "330456925181444106")
		return;
	if(!m.content.startsWith(prefix) && !commandsAwaiting[m.author.id])
		return;
		
	let args = m.content.split(" ");
	let ucmd = args.splice(0,1)[0].slice(prefix.length, 2000);
	
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
	
	cmds.forEach(cmd=>{
		if(cmd.data.name.toLowerCase() == ucmd.toLowerCase())
			commandsAwaiting[m.author.id] = cmd.run(m, args, addToAwaiting);
	});
});


cli.on("guildMemberAdd", m => {
	if(m.guild.id == "239575558147670018"){
		m.roles.add(m.guild.roles.cache.get("812375598278246400"));
		cli.channels.cache.get("812376751438430308").send(`<@${m.id}>`,
			util.getBaseEmbed(`Welcome ${m.displayName}!`, "Verify with the \"!verify\" command to gain additional permissions and channel access!")
		);
	}
});

setInterval(() => {
	for(let id in commandsAwaiting){
		let info = commandsAwaiting[id];
		if(!info) continue;
		if((new Date().getTime() / 1000 - info.started / 1000) > info.timeout){
			if(info.timeoutFunc)
				info.timeoutFunc();
			delete commandsAwaiting[id];
		}
	}
}, 5000)
cli.login(priv.token);
let util = require("../utils/util.js");
let data = require("../utils/data.js");

module.exports.data = {
	name: "help",
	alias: ["commands", "cmds"],
	description: "View available commands"
}

function getCommandsForContext(commands, channel){
	let accessable = []
	for(let cmd of commands)
		if(cmd.data.allowedChannels.length == 0 || cmd.data.allowedChannels.includes(channel))
			accessable.push([cmd.data.name, cmd.data.description, true])
	
	return accessable
}

module.exports.run = (m, args, awaiting, allCommands) => {
	let list = getCommandsForContext(allCommands, m.channel.id);
	m.channel.send(util.getBaseEmbed(`:robot: Available Commands`, "", "succ", list));
}
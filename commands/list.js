let util = require("../utils/util.js");
let data = require("../utils/data.js");
let conf = require("../conf.js");

module.exports.data = {
	name: "list",
	alias: [],
	description: "List all online servers",
	allowedChannels: [conf.channels.admin]
}

module.exports.run = (m, args, awaiting) => {
	if(!m.author.bot){
		RSonMessage(m);
	}
}
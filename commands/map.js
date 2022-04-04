let util = require("../utils/util.js");
let data = require("../utils/data.js");
let conf = require("../conf.js");

module.exports.data = {
	name: "list",
	alias: [],
	description: "View a map for a specified server",
	allowedChannels: [conf.channels.admin]
}

module.exports.run = (m, args, awaiting) => {
	if(!m.author.bot){
		generateMap(m, args[0]);
	}
}
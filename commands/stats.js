let util = require("../utils/util.js");
let data = require("../utils/data.js");

module.exports.data = {
	name: "stats",
	alias: [],
	description: "View a player's statistics"
}

module.exports.run = (m, args, awaiting)=>{
	util.rbxIdFromName(args[0]).then(info => {
		if(!info)
			return m.channel.send(util.getBaseEmbed("User not found", `The user ${args[0]} cannot be found.`, "fail"));
		
		data.rs.get(info.id).then(stats => {
			if(!stats)
				return m.channel.send(util.getBaseEmbed("No data for user", `The player ${args[0]} has no data.\nThis means they have either never played or have not played recently!`, "fail"));

			let wl = stats.Wins / (stats.TotalMatches - stats.Wins);
			m.channel.send(util.getBaseEmbed(`:bar_chart: ${args[0]}'s Statistics`, "", "succ", [
				[":trophy: Wins", stats.Wins, true],
				[":hand_splayed: Losses", stats.TotalMatches - stats.Wins, true],
				[":hourglass_flowing_sand: Total Matches", stats.TotalMatches, true],
				[":chart_with_upwards_trend: W/L Ratio", Number.isNaN(wl) ? 0 : wl.toFixed(2), true],
				[":calendar_spiral: Last Win", (stats.LastWin && new Date(stats.LastWin * 1000) || "never"), true],
				[":diamond_shape_with_a_dot_inside: Points", stats.Points, true]
			]).setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${info.id}&width=420&height=420&format=png`))
		})
	});
}
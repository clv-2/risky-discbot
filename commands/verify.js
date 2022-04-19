let util = require("../utils/util.js");
let data = require("../utils/data.js");
let conf = require("../conf.js");
let waiting = {};

module.exports.data = {
	name: "verify",
	alias: [],
	description: "Verify your account",
	allowedChannels: [conf.channels.verify]
}
/*
util.rbxFromDisc("250329235497943040").then(console.log); // {id, name}
util.rbxIdFromName("clv2").then(console.log); // {id, name}
util.rbxNameFromId("19690989").then(console.log); // {id, name}
util.profileContains("19690989", "qwerty").then(console.log);
util.genCode(5);
util.rand(999);
util.getLinkedAccount("250329235497943040").then(console.log); // ['bloxlink', 'rover']

*/

function verify(member, robloxInfo){
	member.roles.add(conf.roles.member);
	member.roles.remove(conf.roles.unverified);
	member.setNickname(robloxInfo.name);
	data.set("userdata", member.id, {robloxInfo, activity: {}});

}
function gotDone(m, args){
	let expected = waiting[m.author.name].code;
	let rbxInfo = waiting[m.author.name].robloxInfo;
	
	util.profileContains(rbxInfo.id, expected).then(contains => {
		if(contains)
			verify(m.member, rbxInfo);
		else{
			m.channel.send(util.getBaseEmbed("Code not found", `<@${m.author.id}>, code "${expected}" not found on ${rbxInfo.name}'s profile, please verify again.`, "fail"));
		}
		delete waiting[m.author.name];
	});
}
function gotUsername(m, args, awaiting){
	util.rbxIdFromName(args[0]).then(dat => {
		if(dat && dat.id){
			util.getLinkedAccount(m.author.id).then(accts => {
				if(accts && accts.indexOf(dat.id) != -1)
					verify(m.member, dat);
				else{
					waiting[m.author.name] = {robloxInfo: dat, code: util.genCode(5)}
					awaiting(m, {
						started: new Date().getTime(),
						timeout: 60 * 5,
						func: gotDone,
						timeoutFunc: function(){
							m.channel.send(util.getBaseEmbed("Timeout", `<@${m.author.id}>, you have ran out of time to verify your profile. Please try again.`, "fail"));
							delete waiting[m.author.name];
						}
					});
					m.channel.send(util.getBaseEmbed("Verification", `<@${m.author.id}>, put the code "${waiting[m.author.name].code}" in your blurb or status, then say when you are done!`, "prog"));
				}
				
			});
		}else
			m.channel.send(util.getBaseEmbed("User not found", `<@${m.author.id}>, unable to find user ${args[0]} on Roblox, did you make a typo?`, "fail"));
	})
}
module.exports.run = (m, args, awaiting)=>{
	if(args[0] && args[0].trim().length > 0){
		return gotUsername(m, args, awaiting);
	}
	m.channel.send(util.getBaseEmbed("Verification", `<@${m.author.id}>, enter your Roblox username to continue.`, "prog"));
	return {
		started: new Date().getTime(),
		timeout: 60 * 5,
		func: gotUsername,
		timeoutFunc: function(){
			m.channel.send(util.getBaseEmbed("Timeout", `<@${m.author.id}>, you have ran out of time to verify your profile. Please try again.`, "fail"));
		}
	}
}
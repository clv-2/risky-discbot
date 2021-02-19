let fs = require("fs");
let http = require("http");
let https = require("https");
let djs = require("discord.js");
let col = ["White","Grey","Light yellow","Brick yellow","Light green (Mint)","Light reddish violet","Pastel Blue","Light orange brown","Nougat","Bright red","Med. reddish violet","Bright blue","Bright yellow","Earth orange","Black","Dark grey","Dark green","Medium green","Lig. Yellowich orange","Bright green","Dark orange","Light bluish violet","Transparent","Tr. Red","Tr. Lg blue","Tr. Blue","Tr. Yellow","Light blue","Tr. Flu. Reddish orange","Tr. Green","Tr. Flu. Green","Phosph. White","Light red","Medium red","Medium blue","Light grey","Bright violet","Br. yellowish orange","Bright orange","Bright bluish green","Earth yellow","Bright bluish violet","Tr. Brown","Medium bluish violet","Tr. Medi. reddish violet","Med. yellowish green","Med. bluish green","Light bluish green","Br. yellowish green","Lig. yellowish green","Med. yellowish orange","Br. reddish orange","Bright reddish violet","Light orange","Tr. Bright bluish violet","Gold","Dark nougat","Silver","Neon orange","Neon green","Sand blue","Sand violet","Medium orange","Sand yellow","Earth blue","Earth green","Tr. Flu. Blue","Sand blue metallic","Sand violet metallic","Sand yellow metallic","Dark grey metallic","Black metallic","Light grey metallic","Sand green","Sand red","Dark red","Tr. Flu. Yellow","Tr. Flu. Red","Gun metallic","Red flip/flop","Yellow flip/flop","Silver flip/flop","Curry","Fire Yellow","Flame yellowish orange","Reddish brown","Flame reddish orange","Medium stone grey","Royal blue","Dark Royal blue","Bright reddish lilac","Dark stone grey","Lemon metalic","Light stone grey","Dark Curry","Faded green","Turquoise","Light Royal blue","Medium Royal blue","Rust","Brown","Reddish lilac","Lilac","Light lilac","Bright purple","Light purple","Light pink","Light brick yellow","Warm yellowish orange","Cool yellow","Dove blue","Medium lilac","Slime green","Smoky grey","Dark blue","Parsley green","Steel blue","Storm blue","Lapis","Dark indigo","Sea green","Shamrock","Fossil","Mulberry","Forest green","Cadet blue","Electric blue","Eggplant","Moss","Artichoke","Sage green","Ghost grey","Lilac","Plum","Olivine","Laurel green","Quill grey","Crimson","Mint","Baby blue","Carnation pink","Persimmon","Maroon","Gold","Daisy orange","Pearl","Fog","Salmon","Terra Cotta","Cocoa","Wheat","Buttermilk","Mauve","Sunrise","Tawny","Rust","Cashmere","Khaki","Lily white","Seashell","Burgundy","Cork","Burlap","Beige","Oyster","Pine Cone","Fawn brown","Hurricane grey","Cloudy grey","Linen","Copper","Dirt brown","Bronze","Flint","Dark taupe","Burnt Sienna","Institutional white","Mid gray","Really black","Really red","Deep orange","Alder","Dusty Rose","Olive","New Yeller","Really blue","Navy blue","Deep blue","Cyan","CGA brown","Magenta","Pink","Deep orange","Teal","Toothpaste","Lime green","Camo","Grime","Lavender","Pastel light blue","Pastel orange","Pastel violet","Pastel blue-green","Pastel green","Pastel yellow","Pastel brown","Royal purple","Hot pink"];
let genres = [col]; // "couldn't you put this in a different file" -> yes i don't care enough to


function httpsPromise(url){
	return new Promise(res => {
		https.get(url, str => {
			let data = "";
			str.on("data", chunk => data += chunk);
			str.on("end", () => {
				res(data);
			});
		});
	});
}
function rbxFromDisc(disc){
	return new Promise(async res => {
		let resp = await httpsPromise("https://verify.eryn.io/api/user/"+disc);
		let parsed = JSON.parse(data);
		if(parsed.status == "ok")
			res({id: parsed.robloxId, name: parsed.robloxUsername});
		else
			res();
	});
}
function rbxIdFromName(name){
	return new Promise(async res => {
		let resp = await httpsPromise("https://api.roblox.com/users/get-by-username?username="+name);
		let parsed = JSON.parse(resp);
		if(!parsed.errors)
			res({id: parsed.Id, name: parsed.Username});
		else
			res();
	});
}
function rbxNameFromId(id){
	return new Promise(async res => {
		let resp = await httpsPromise("https://api.roblox.com/users/"+id);
		let parsed = JSON.parse(resp);
		if(!parsed.errors)
			res({id: parsed.Id, name: parsed.Username});
		else
			res();
	});
}
function profileContains(id, txt){
	return new Promise(res => {
		Promise.all([httpsPromise("https://users.roblox.com/v1/users/"+id), httpsPromise("https://users.roblox.com/v1/users/"+id+"/status")]).then(vals => {
			let desc = JSON.parse(vals[0]).description, status = JSON.parse(vals[1]).status;
			if((desc && desc.indexOf(txt) != -1) || (status && status.indexOf(txt) != -1))
				res(true);
			res(false);
		});
	});
}
function getLinkedAccount(id){
	return new Promise(res => {
		Promise.all([httpsPromise("https://api.blox.link/v1/user/"+id), httpsPromise("https://verify.eryn.io/api/user/"+id)]).then(vals => {
			let bloxlink = JSON.parse(vals[0]).primaryAccount, rover = JSON.parse(vals[1]).robloxId;
			if(bloxlink || rover)
				res([Number(bloxlink), Number(rover)])
			else
				res();
		});
	});
}
function getBaseEmbed(title, desc, col, fields){
	let emb = new djs.MessageEmbed()
		.setColor(({fail: 0xe74c3c, succ: 0x3498db, prog: 0x7827ff})[col] || 0x3498db)
		.setTitle(title || "")
		.setDescription(desc || "");
	(fields || []).forEach(field => {
		emb.addField(String(field[0]), String(field[1]), field[3]);
	});
	
	return emb;
}
function rand(max){
	return Math.floor(Math.random() * max);
}
function genCode(len){
	let code = "";
	for(i = 0; i < len; i++){
		let subj = genres[rand(genres.length)];
		code += subj[rand(subj.length)].toLowerCase() + " ";
	}
	return code.trim();
}

module.exports = {
	rbxFromDisc,
	rbxIdFromName,
	rbxNameFromId,
	profileContains,
	getLinkedAccount,
	getBaseEmbed,
	rand,
	genCode
};
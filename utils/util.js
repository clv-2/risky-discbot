let https = require("https");
let djs = require("discord.js");
const priv = require("../priv");
let col = ["White","Grey","Light yellow","Brick yellow","Light green (Mint)","Light reddish violet","Pastel Blue","Light orange brown","Nougat","Bright red","Med. reddish violet","Bright blue","Bright yellow","Earth orange","Black","Dark grey","Dark green","Medium green","Lig. Yellowich orange","Bright green","Dark orange","Light bluish violet","Transparent","Tr. Red","Tr. Lg blue","Tr. Blue","Tr. Yellow","Light blue","Tr. Flu. Reddish orange","Tr. Green","Tr. Flu. Green","Phosph. White","Light red","Medium red","Medium blue","Light grey","Bright violet","Br. yellowish orange","Bright orange","Bright bluish green","Earth yellow","Bright bluish violet","Tr. Brown","Medium bluish violet","Tr. Medi. reddish violet","Med. yellowish green","Med. bluish green","Light bluish green","Br. yellowish green","Lig. yellowish green","Med. yellowish orange","Br. reddish orange","Bright reddish violet","Light orange","Tr. Bright bluish violet","Gold","Dark nougat","Silver","Neon orange","Neon green","Sand blue","Sand violet","Medium orange","Sand yellow","Earth blue","Earth green","Tr. Flu. Blue","Sand blue metallic","Sand violet metallic","Sand yellow metallic","Dark grey metallic","Black metallic","Light grey metallic","Sand green","Sand red","Dark red","Tr. Flu. Yellow","Tr. Flu. Red","Gun metallic","Red flip/flop","Yellow flip/flop","Silver flip/flop","Curry","Fire Yellow","Flame yellowish orange","Reddish brown","Flame reddish orange","Medium stone grey","Royal blue","Dark Royal blue","Bright reddish lilac","Dark stone grey","Lemon metalic","Light stone grey","Dark Curry","Faded green","Turquoise","Light Royal blue","Medium Royal blue","Rust","Brown","Reddish lilac","Lilac","Light lilac","Bright purple","Light purple","Light pink","Light brick yellow","Warm yellowish orange","Cool yellow","Dove blue","Medium lilac","Slime green","Smoky grey","Dark blue","Parsley green","Steel blue","Storm blue","Lapis","Dark indigo","Sea green","Shamrock","Fossil","Mulberry","Forest green","Cadet blue","Electric blue","Eggplant","Moss","Artichoke","Sage green","Ghost grey","Lilac","Plum","Olivine","Laurel green","Quill grey","Crimson","Mint","Baby blue","Carnation pink","Persimmon","Maroon","Gold","Daisy orange","Pearl","Fog","Salmon","Terra Cotta","Cocoa","Wheat","Buttermilk","Mauve","Sunrise","Tawny","Rust","Cashmere","Khaki","Lily white","Seashell","Burgundy","Cork","Burlap","Beige","Oyster","Pine Cone","Fawn brown","Hurricane grey","Cloudy grey","Linen","Copper","Dirt brown","Bronze","Flint","Dark taupe","Burnt Sienna","Institutional white","Mid gray","Really black","Really red","Deep orange","Alder","Dusty Rose","Olive","New Yeller","Really blue","Navy blue","Deep blue","Cyan","CGA brown","Magenta","Pink","Deep orange","Teal","Toothpaste","Lime green","Camo","Grime","Lavender","Pastel light blue","Pastel orange","Pastel violet","Pastel blue-green","Pastel green","Pastel yellow","Pastel brown","Royal purple","Hot pink"];
let genres = [col]; // "couldn't you put this in a different file" -> yes i don't care enough to
// array of one array since i did originally have an array of arrays with separate lists but roblox censor was trash so i am now limited to just a list of their colors
// (if any of these ever are censored, then they are literally censoring their own colors)

function httpsGet(url, headers){
	return new Promise(res => {
		https.get(url, {headers}, str => {
			let data = "";
			str.on("data", chunk => data += chunk);
			str.on("end", () => {
				res(data);
			});
		});
	});
}
function httpsPost(hostname, path, data){
	return new Promise(res => {
		data = JSON.stringify(data);
		let opt = {
			hostname, path,
			method: "POST",
			headers: {"Content-Type": "application/json"}
		}

		let req = https.request(opt, str => {
			let data = "";
			str.on("data", chunk => data += chunk);
			str.on("end", () => {
				res(data);
			});
		});

		req.write(data);
		req.end();
	});
}
function rbxFromDisc(disc){
	return new Promise(async res => {
		let resp = await httpsGet("https://verify.eryn.io/api/user/"+disc);
		let parsed = JSON.parse(resp);
		if(parsed.status == "ok")
			res({id: parsed.robloxId, name: parsed.robloxUsername});
		else
			res();
	});
}
function rbxIdFromName(name){
	return new Promise(async res => {
		let obj = {usernames: [name]}
		let resp = await httpsPost("users.roblox.com", "/v1/usernames/users", obj);
		let parsed = JSON.parse(resp);
		if(!parsed.errors)
			res({id: parsed.data[0].id, name: parsed.data[0].name});
		else
			res();
	});
}
function rbxNameFromId(id){
	return new Promise(async res => {
		let resp = await httpsGet("https://users.roblox.com/v1/users/"+id);
		let parsed = JSON.parse(resp);
		if(!parsed.errors)
			res({id: parsed.id, name: parsed.name});
		else
			res();
	});
}
function profileContains(id, txt){
	return new Promise(res => {
		httpsGet("https://users.roblox.com/v1/users/"+id).then(val => {
			let desc = JSON.parse(val).description
			if(desc && desc.indexOf(txt) != -1)
				res(true);
			res(false);
		});
	});
}
function getLinkedAccount(id){
	return new Promise(res => {
		Promise.all([httpsGet("https://v3.blox.link/developer/discord/"+id, {"api-key": priv.bloxlink}), httpsGet("https://verify.eryn.io/api/user/"+id)]).then(vals => {
			let bloxlink = JSON.parse(vals[0]);
			let rover = JSON.parse(vals[1]);

			rover = rover.robloxId;
			bloxlink = bloxlink.success ? bloxlink.user.primaryAccount : undefined;
			
			if(bloxlink || rover)
				res([Number(bloxlink), Number(rover)])
			else
				res();
		});
	});
}
getLinkedAccount(250329235497943040).then(console.log)
function getBaseEmbed(title, desc, col, fields){
	let emb = new djs.MessageEmbed()
		.setColor(({fail: 0xe74c3c, succ: 0x3498db, prog: 0x7827ff})[col] || 0x3498db)
		.setTitle(title || "")
		.setDescription(desc || "");
	for(let field of (fields || []))
		emb.addField(String(field[0]), String(field[1]), field[2]);
	
	return emb;
}
function rand(max){
	return Math.floor(Math.random() * max);
}
function genCode(len){
	let code = "";
	for(i = 0; i < len; i++){
		let subj = genres[rand(genres.length)];
		code += subj[rand(subj.length)].toLowerCase().replace(/[^a-zA-Z ]/g, "") + " ";
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
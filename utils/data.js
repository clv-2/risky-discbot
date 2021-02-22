if(!global.db){
	return console.log("No db found");
}
let data = { rs: {} };
let col = db.collection("risky_disc_data");
let query = {};
let cache = {userdata: {}};

function decompressRS(data){
	return {
		TotalMatches: data[0],
		userId: data[1],
		Points: data[2],
		Wins: data[3],
		name: data[4],
		LastWin: data[5],
		Boosted: data[6]
	};
}

data.set = function(store, key, val){
	if(cache[store])
		cache[store][key] = val;
	
	col.updateOne({key, store}, {$set: {data: val}}, {upsert: true});
}
data.get = function(store, key){
	return new Promise(res => {
		if(cache[store] && cache[store][key])
			return res(cache[store][key]);
		
		col.findOne({key, store}, (err, doc) => {
			if(err || !doc || !doc.data)
				return res();
			
			if(cache[store])
				cache[store][key] = doc.data;
			res(doc.data);
		});
	});
}
data.update = function(store, key, datakey, value){
	if(cache[store] && cache[store][key])
		cache[store][key][datakey] = value;
	
	col.updateOne({key, store}, {$set: {[`data.${datakey}`]: value}});
}
data.queryUpdate = function(store, key, datakey, value){
	if(!query[store]) query[store] = {};
	if(!query[store][key]) query[store][key] = {};
	if(cache[store] && cache[store][key])
		cache[store][key][datakey] = value;
	query[store][key][datakey] = value;
}
data.rs.get = function(id){
	return new Promise(res => {
		db.collection("riskystore_1").findOne({key: id + "_RISKYDATA"}, (err, doc) => {
			if(err || !doc || !doc.value)
				return res();

			res(decompressRS(JSON.parse(doc.value)));
		});
	});
}

setInterval(()=>{
	for(store in query)
		for(key in query[store]){
			let req = {};
			for(datakey in query[store][key])
				req[`data.${datakey}`] = query[store][key][datakey];
			col.updateOne({key, store}, {$set: req});
		}
	
	query = {};
}, 60000);

module.exports = data;
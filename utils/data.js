if(!global.db){
	return console.log("No db found");
}
let data = { rs: {} };
let col = db.collection("risky_disc_data");

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
	col.updateOne({key, store}, {$set: {data: val}}, {upsert: true});
}
data.get = function(store, key){
	return new Promise(res => {
		col.findOne({key, store}, (err, doc) => {
			if(err || !doc || !doc.data)
				return res();
			
			res(doc.data);
		});
	});
}
data.update = function(store, key, datakey, value){
	col.updateOne({key, store}, {$set: {[`data.${datakey}`]: value}});
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

module.exports = data;
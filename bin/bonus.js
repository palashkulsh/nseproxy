var debug = require("debug")('bin.bonus');
var util = require("util");
var Async = require("async");
var request = require("request");
var tabletojson = require('tabletojson');
var SqlLib = require('../lib/mysqlcon');
var moment = require('moment');

var tableToSystemMap = {
    '1': 'ratio',
    '2': 'announcement',
    '3': 'record',
    '4': 'ex_bonus',    
}

function initMcToSymbolMap(cb){
    var query = 'select symbol,mc_symbol from symbol_mc_map';
    SqlLib.exec(query,function (err,res){
	if(err){
	    return cb(err);
	}
	var map={};
	res.forEach(function (eachres){
	    map[eachres.mc_symbol] = eachres.symbol;
	});
	return cb(null, map);
    });
}

function getBonusForYear(year,cb){
    debug('calling bonus for year '+year);
    var options = { method: 'GET',
		    url: 'http://www.moneycontrol.com/stocks/marketinfo/bonus/homebody.php',
		    qs: { sel_year: year },
		    headers: 
		    { 'postman-token': 'f83cb2fb-8ded-195f-f1d2-d137eb98ddd2',
		      'cache-control': 'no-cache' } };

    request(options, function (error, response, body) {
	if (error) cb(error);
	debug('gotData for year '+year);
	return cb(null,body);
    });
}

function getTables(html,cb){
    var tablesAsJson = tabletojson.convert(html);
    return cb(null,tablesAsJson);
}

function insertToBonusTable(data,cb){
    var insertData=[];
    if(!util.isArray(data)){
	insertData = [data];
    }else{
	insertData = data;
    }
    Async.eachLimit(insertData,1,function(eachData,lcb){
	var query = util.format('insert into bonus (symbol,bonus_share,holds_share,record,announcement,ex_bonus) values ("%s","%s","%s","%s","%s","%s")',eachData.symbol,eachData.bonus_share,eachData.holds_share,eachData.record,eachData.announcement,eachData.ex_bonus);
	debug(query);
	SqlLib.exec(query,function (err){ 
	    if(err)
		debug(err.toString());
	    return lcb()
	});
    },cb);
}

function fetchBonus(year,cb){    
    getBonusForYear(year,function (err,html){
	if(err){
	    debug(err);
	    return cb(err);
	}
	getTables(html,function (err, data){
	    if(err){
		return cb(err);
	    }
	    initMcToSymbolMap(function (err,map){
		if(err){
		    return cb(err);
		}
		debugger
		var newData = [];
		data.forEach(function (eachTable){
		    eachTable.forEach(function(k){
			var temp={};
			if(!k.mc_symbol || !map[k.mc_symbol]){
			    return;
			}
			temp.symbol = map[k.mc_symbol];
			Object.keys(tableToSystemMap).forEach(function (key){
			    if(k[key]){
				temp[tableToSystemMap[key]]=k[key];
			    }
			});
			temp.bonus_share=temp.ratio.split(':')[0];
			temp.holds_share=temp.ratio.split(':')[1];
			temp.announcement = moment(temp.announcement,'DD-MM-YYYY').isValid() && moment(temp.announcement,'DD-MM-YYYY').format('YYYY-MM-DD');
			temp.record = moment(temp.record,'DD-MM-YYYY').isValid() && moment(temp.record,'DD-MM-YYYY').format('YYYY-MM-DD')
			temp.ex_bonus = moment(temp.ex_bonus,'DD-MM-YYYY').isValid() && moment(temp.ex_bonus,'DD-MM-YYYY').format('YYYY-MM-DD');
			newData.push(temp);
		    });
		});
		return cb(null, newData);
	    });
	});
    });
}

function fetchAndInsertForYear(year, cb){
    Async.waterfall([
	Async.constant(year),
	fetchBonus,
	insertToBonusTable
    ],cb);
}

function fetAndInsertForAllYears(cb){
    var years= [];
    for(i=1986;i<2017;i++){
	years.push(i);
    }
    Async.eachLimit(years,9,function (year,lcb){
	fetchAndInsertForYear(year,lcb);
    },cb);
}

(function(){
    if(require.main==module){	
	fetAndInsertForAllYears(2011,function (err){
	    console.log(arguments,'alldone');
	});
    }
})();

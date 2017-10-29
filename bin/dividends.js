var debug = require("debug")('bin.dividends');
var util = require("util");
var Async = require("async");
var request = require("request");
var tabletojson = require('tabletojson');
var SqlLib = require('../lib/mysqlcon');
var moment = require('moment');

var tableToSystemMap = {
    '1': 'type',
    '2': 'value_pcent',
    '3': 'announcement',
    '4': 'record',
    '5': 'ex_dividend',    
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

function getDividendForYear(year,cb){
    debug('calling dividend for year '+year);
    var options = { method: 'GET',
		    url: 'http://www.moneycontrol.com/stocks/marketinfo/dividends_declared/homebody.php',
		    qs: { sel_year: year },
		    headers: 
		    { 'postman-token': 'f83cb2fb-8ded-195f-f1d2-d137eb98ddd2',
		      'cache-control': 'no-cache' } };

    request(options, function (error, response, body) {
	if (error) return cb(error);
	debug('gotData for year '+year);
	return cb(null,body);
    });
}

function getTables(html,cb){
    var tablesAsJson = tabletojson.convert(html);
    return cb(null,tablesAsJson);
}

function insertToDividendsTable(data,cb){
    var insertData=[];
    if(!util.isArray(data)){
	insertData = [data];
    }else{
	insertData = data;
    }
    Async.eachLimit(insertData,1,function(eachData,lcb){
	var query = util.format('insert into dividend (symbol,value_pcent,type,record,announcement,ex_dividend) values ("%s","%s","%s","%s","%s","%s")',eachData.symbol,eachData.value_pcent,eachData.type,eachData.record,eachData.announcement,eachData.ex_dividend);
	debug(query);
	SqlLib.exec(query,function (err){ 
	    if(err)
		debug(err.toString());
	    return lcb()
	});
    },cb);
}

function fetchDividends(year,cb){    
    getDividendForYear(year,function (err,html){
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
			temp.announcement = moment(temp.announcement,'DD-MM-YYYY').isValid() && moment(temp.announcement,'DD-MM-YYYY').format('YYYY-MM-DD');
			temp.record = moment(temp.record,'DD-MM-YYYY').isValid() && moment(temp.record,'DD-MM-YYYY').format('YYYY-MM-DD')
			temp.ex_dividend = moment(temp.ex_dividend,'DD-MM-YYYY').isValid() && moment(temp.ex_dividend,'DD-MM-YYYY').format('YYYY-MM-DD');
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
	fetchDividends,
	insertToDividendsTable
    ],cb);
}

function fetAndInsertForAllYears(cb){
    var years= [];
    for(i=2016;i<2018;i++){
	years.push(i);
    }
    Async.eachLimit(years,10,fetchAndInsertForYear,cb);
}

(function(){
    if(require.main==module){	
	fetAndInsertForAllYears(function(err){
	    console.log(err,'all done');
	    
	});
    }
})();

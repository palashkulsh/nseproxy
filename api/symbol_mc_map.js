var debug = require('debug')('api.symbol_mc_map');
var Async = require('async');
var MoneyControlModel = require('../model/money_control');
var request = require("request");
var parseString = require('xml2js').parseString;
var Path = require('path');
var HistoricalDataApi = require('./historical_data');
var NseGetQuoteModel = require('../model/nse_get_quote');
var Symbols = require('../config/symbols');
var SqlLib = require('../lib/mysqlcon');
var DataUtils = require('../lib/data_utils');

function getPeerDataForSymbol(symbol,callback){
    var options = { method: 'GET',
		    url: 'https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/ajaxPeerCompanies.jsp',
		    qs: { symbol: symbol },
		    headers: 
		    { 'postman-token': '19982dfe-664a-b9ff-2ea1-594fa74951ab',
		      'cache-control': 'no-cache',
		      cookie: 'pointer_il=1; sym_il1=AUSTRAL; sym2=MGL; sym3=TATAMOTORS; sym4=INDTERRAIN; pointer=4; ext_name=jaehkpjddfdgiiefcnhahapilbejohhj',
		      'accept-language': 'en-US,en;q=0.8',
		      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36',
		      'upgrade-insecure-requests': '1',
		      'x-devtools-emulate-network-conditions-client-id': 'FF560037-7FAD-4653-9839-FDFC42DBBFAD',
		      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' } };

    request(options, function (error, response, body) {
	if (error) return callback(error);
	try{
	    body = eval('(' + body + ')'); // for relaxed json parsing because in response industry key is without quotes
	}catch(ex){
	    return callback(ex);
	}
	return callback(null,body)
    });
}

function getSymbolDataForAll(cb){
    Async.waterfall([
	function getFromTable(wcb){
	    var query='select * from symbol_mc_map ';
	    SqlLib.exec(query,wcb);
	},
	function fillData(symbolData,wcb){
	    var symbolMap = DataUtils.buildMap(symbolData,'symbol');
	    Async.eachLimit(symbolData,100,function (eachData,scb){
		if(eachData.industry>=0 && eachData.name){
		    return scb();
		}
		getPeerDataForSymbol(eachData.symbol,function (err,peerData){
		    if(err){
			debug(err);
			return scb();
		    }
		    if(peerData.industry){
			eachData.industry = peerData.industry;
		    }
		    if(!peerData || !peerData.data || !peerData.data.length ){
			debug('got no peer data for symbol '+eachData.symbol);
			return scb();
		    }
		    debug('got peerdata for symbol '+eachData.symbol);
		    peerData.data.forEach(function (eachPeer){
			if(symbolMap[eachPeer.symbol]){
			    symbolMap[eachPeer.symbol][0].industry = eachPeer.industry;
			    symbolMap[eachPeer.symbol][0].name = eachPeer.name;
			}
		    });
		    return scb();
		});
	    },function (){
		return wcb(null,symbolData);
	    });	    
	},
	function updateSymbolMcMap(symbolData,wcb){
	    Async.eachLimit(symbolData,100,function (eachData,lcb){
		console.log(eachData)
		var query = 'update symbol_mc_map set name="'+eachData.name+'" ,industry='+eachData.industry+' where symbol="'+eachData.symbol+'"';
		debug(query);
		return SqlLib.exec(query,function (err){
		    if(err){
			debug(err);
			return lcb();
		    }
		    return lcb();
		});
	    },function (err){
		return wcb(null,symbolData);
	    });
	}
    ],cb);
}

(function(){
    if(require.main==module){
	getSymbolDataForAll(console.log)	
	//console.log)
    }
})();

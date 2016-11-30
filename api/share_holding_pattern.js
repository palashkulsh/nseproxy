var Async = require('async');
var debug = require('debug')('api.share_holding_pattern');
var NseGetHoldingsModel = require('../model/nse_get_holdings');
var HoldingsModel = require('../model/holdings');
var Symbols = require('../config/symbols');

var HoldingsApi = {
    getAndInsertHoldingsForSymbol: function (symbol,cb){
	Async.waterfall([
	    Async.constant(symbol),
	    function (symbol,callback){
		NseGetHoldingsModel.getHoldings(symbol,function (err,res){
		    return callback(err,symbol,res);
		});
	    },
	    function(symbol,result,callback){
		HoldingsModel.insert(result,callback);
	    }
	],function (err){
	    return cb(err);
	})
    },
    
    getAndInsertHoldingsForAllSymbols: function (symbols,cb){
	Async.eachLimit(symbols,100,function (symbol,callback){
	    HoldingsApi.getAndInsertHoldingsForSymbol(symbol,function (err){
		if(err){
		    debug(err);
		}
		return callback();
	    });
	},cb);
    }
};
module.exports=HoldingsApi;

(function(){
    if(require.main==module){
	//HoldingsApi.getAndInsertHoldingsForSymbol('ZICOM',console.log)
	HoldingsApi.getAndInsertHoldingsForAllSymbols(Symbols,function(err){
	    console.log('all done');
	    process.exit(0);
	});
    }
})();

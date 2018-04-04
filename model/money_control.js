
var sql = require('sql');
var sqlLib = require('../lib/mysqlcon');
var Util = require('util');
var Constants = require('../config/constants');
var Async = require('async');
var debug = require('debug')('model.stock_data');
var DataUtils = require('../lib/data_utils');

var symbolMcMapSchema = {
    'name': 'symbol_mc_map',
    'columns': ['id', 'symbol','mc_symbol', 'isin', 'bse', 'created_at']
};

var SymbolMcMapModel = {
    table : sqlLib.define(symbolMcMapSchema),
    insert: function(insertData, options, cb){
	var table=this.table;
	if(!insertData || !insertData.length){
	    return cb();
	}
	// if one or more data is already present then whole batch wont be inserted due to unique constraint
	//thus make insert each data in seperate query
	var singleBatchSize=1;	
	var dataMultiArray = DataUtils.multiArray(insertData,singleBatchSize);
	Async.eachLimit(dataMultiArray,10,function (eachData,callback){
	    query = table.insert(eachData);
	    sqlLib.exec(query,function (err,result){
		if(err){
		    if(err.code==='ER_DUP_ENTRY' &&  err.errno===1062){
			debug('data already present so not reinserting');
			// Util.log(err);
		    }else{
			debug(err);
		    }
		}
		return callback();
	    });
	},function (err){
	    return cb(err);
	});
    }
}
module.exports=SymbolMcMapModel;

(function(){
    if(require.main==module){
	SymbolMcMapModel.insert([{
	    symbol:'PNB',
	    mc_symbol:'PNB05',
	    isin:'safafasfa',
	    bse: 'asagqwrq'
	}],{},console.log)
    }
})();

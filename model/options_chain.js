var sql = require('sql');
var sqlLib = require('../lib/mysqlcon');
var Util = require('util');
// var Constants = require('../config/constants');
var Async = require('async');
var debug = require('debug')('model.stock_data');
var DataUtils = require('../lib/data_utils');

var stockDataSchema = {
  'name': 'options_chain',
  'columns': ['datetime','type','strikePrice','expiryDate','underlying','identifier','openInterest','changeinOpenInterest','pchangeinOpenInterest','totalTradedVolume','impliedVolatility','lastPrice','changes','pChange','totalBuyQuantity','totalSellQuantity','bidQty','bidprice','askQty','askPrice','underlyingValue','created_at']
};

var MfDataModel = {
  table : sqlLib.define(stockDataSchema),
  get: function (query, cb){
	  sqlLib.exec(query, cb);
  },
  
  insert: function(data, options, cb){
	  var table=this.table;
	  var insertData = data;
	  if(!insertData || !insertData.length){
	    return cb();
	  }
	  // if one or more data is already present then whole batch wont be inserted due to unique constraint
	  //thus make insert each data in seperate query
	  var singleBatchSize=1;	
	  var dataMultiArray = DataUtils.multiArray(insertData,singleBatchSize);
	  Async.eachLimit(dataMultiArray,1000,function (eachData,callback){
	    query = table.insert(eachData);
	    sqlLib.exec(query,function (err,result){
		    if(err){
		      if(err.code==='ER_DUP_ENTRY' &&  err.errno===1062){
			      debug('data already present so not reinserting');
			      //Util.log(err);
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

module.exports=MfDataModel;

(function(){
  if(require.main==module){
    MfDataModel.insert([{name:'mf name',isin:'isin',nav:23,date:'2020-02-10'}], {},console.log)
  }
})();

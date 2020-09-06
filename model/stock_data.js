
var sql = require('sql');
var sqlLib = require('../lib/mysqlcon');
var Util = require('util');
var Constants = require('../config/constants');
var Async = require('async');
var debug = require('debug')('model.stock_data');
var DataUtils = require('../lib/data_utils');

var stockDataSchema = {
  'name': 'stock_data',
  'columns': ['id', 'symbol','series','date','prev_close','open_price','high_price','low_price','last_price','close_price','average_price','total_traded_quantity','turnover_in_lacs','no_of_trades','deliverable_qty','percent_dly_qt_to_traded_qty','created_at','updated_at']
};

/**
 * takes data with nse keys and transforms to keys understandable by system
 */
function nseToSystemDataActual(data){
  var newData={};
  debugger
  if(!Object.keys(data) || !Object.keys(data).length){
	  return newData;
  }
  Object.keys(data).forEach(function (oldKey){
	  if(Constants.NSE_TO_SYSTEM_MAP_V2[oldKey]){
      if(Constants.NSE_TO_SYSTEM_TYPE_MAP_V2[oldKey]=='number' && isNaN(data[oldKey])){
        debugger
        data[oldKey] = null;
      }
      newData[Constants.NSE_TO_SYSTEM_MAP_V2[oldKey]]=data[oldKey];
	  }
  });
  return newData;
}

function nseToSystemData(data){
  if(!data){
	  return [];
  }
  var newData=[];
  if(Util.isArray(data)){
	  var temp={};
	  data.forEach(function (eachData){
	    temp=nseToSystemDataActual(eachData);
	    if(Object.keys(temp).length){
		    newData.push(temp);
	    }
	  });
  }else{
	  temp=nseToSystemDataActual(data);
	  if(Object.keys(temp).length){
	    newData.push(temp);
	  }
  }
  return newData;
}

var StockDataModel = {
  table : sqlLib.define(stockDataSchema),
  get: function (query, cb){
	  sqlLib.exec(query, cb);
  },
  
  insert: function(data, options, cb){
	  var table=this.table;
	  var insertData = nseToSystemData(data);
	  if(!insertData || !insertData.length){
      console.log('no dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
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

module.exports=StockDataModel;

(function(){
  if(require.main==module){
	  StockDataModel.insert({ 
	    'Symbol': 'PNB',
	    'Series': 'EQ',
	    'Date': '2016-07-22',
	    'Prev Close': 123.65,
	    'Open Price': 122.8,
	    'High Price': 122.85,
	    'Low Price': 119.4,
	    'Last Price': 120.15,
	    'Close Price': 120.2,
	    'Average Price': 120.89,
	    'Total Traded Quantity': 21835148,
	    'Turnover in Lacs': 26395.8,
	    'No. of Trades': 69696,
	    'Deliverable Qty': 2739419,
	    '% Dly Qt to Traded Qty': '-'
	  },{},console.log)
  }
})();

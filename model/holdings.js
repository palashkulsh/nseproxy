
var sql = require('sql');
var sqlLib = require('../lib/mysqlcon');
var Util = require('util');
var Constants = require('../config/constants');
var Async = require('async');
var debug = require('debug')('model.stock_data');
var DataUtils = require('../lib/data_utils');

var holdingsSchema = {
    'name':'holdings',
    'columns':['id','promoter','public','employee','total','symbol','date','created_at','updated_at']
};

function nseToSystemData(data){
    var dataArr=[];
    if(!data.category || !data.category.length || !data.holdingPercent || !data.holdingPercent.length){
	return dataArr;
    }
    var keys = Object.keys(Constants.NSE_TO_SYSTEM_HOLDING_MAP);
    var tempIndex=-1;
    var dt;
    data.asOnDate.forEach(function (d){
	var temp={};
	keys.forEach(function (value){
	    tempIndex = data.category.indexOf(value);
	    if(tempIndex<0){
		return;
	    }
	    temp[Constants.NSE_TO_SYSTEM_HOLDING_MAP[value]]=Number(data.holdingPercent[tempIndex]);	    
	});
	dt = new Date(d);
	temp.date = dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate();
	temp.symbol=data.symbol;

	dataArr.push(temp);
    });
    return dataArr;
}

var HoldingsModel = {
    table : sqlLib.define(holdingsSchema),
    insert : function (data,cb){
	var table=this.table;
	var insertData = nseToSystemData(data);
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
			Util.log(err);
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
};
module.exports=HoldingsModel;
(function(){
    if(require.main==module){
	var data={"symbol":"ZICOM","success":"true","asOnDate":["30-Jun-2016","30-Sep-2016"],"category":["Promoter & Promoter Group","Public","Shares held by Employee Trusts","Total","Promoter & Promoter Group","Public","Shares held by Employee Trusts","Total"],"holdingPercent":["  20.98","  79.02","   0.00"," 100.00","  20.98","  79.02","   0.00"," 100.00"]};
	HoldingsModel.insert(data,console.log);
    }
})();

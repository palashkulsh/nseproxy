/**
   script that finds the sentiments in director's report, auditor's report and chairman's speech for data present in stock_txt_data table
   currently it just dumps the sentimenets on the command line

   next steps
   push the sentiments data in the elastic search for analytics 
*/
var sentiment= require('sentiment');
var sqlLib = require('../lib/mysqlcon');
var Async = require('async');
var debug = require('debug');

function getData(cb){
    var query = 'select symbol,data,year,type from stock_txt_data';// where length(data)>100 ';
    sqlLib.exec(query,cb)
}

(function(){
    if(require.main==module){
	var results={};
	getData(function (err,res){
	    if(err){
		process.exit(1);
	    }

	    Async.eachLimit(res,100,function (k,callback){
		var temp = sentiment(k.data);
		debug('processing '+k.symbol+' '+k.type+' '+k.year );
		var query = 'update stock_txt_data set score='+temp.score+',comparative='+temp.comparative+' where symbol="'+k.symbol+'" and year='+k.year+' and type="'+k.type+'"';
		sqlLib.exec(query,callback);
	    },function(err){
		if(err){
		    console.log(err);
		    process.exit(1);
		}
		console.log('all done successfuly');
		process.exit(0);
	    });
	});
	// console.log(results);
    }
})();

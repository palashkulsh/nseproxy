/**
   script that finds the sentiments in director's report, auditor's report and chairman's speech for data present in stock_txt_data table
   currently it just dumps the sentimenets on the command line

   next steps
   push the sentiments data in the elastic search for analytics 
*/
var sentiment= require('sentiment');
var sqlLib = require('../lib/mysqlcon');

function getData(cb){
    var query = 'select symbol,data,year,type from stock_txt_data where length(data)>100 ';
    sqlLib.exec(query,cb)
}

(function(){
    if(require.main==module){
	var results={};
	getData(function (err,res){
	    if(err){
		process.exit(1);
	    }
	    var temp;
	    res.forEach(function (k){
		if(!results[k.symbol]){
		    results[k.symbol]={};
		}
		results[k.symbol][k.type]={};
		temp=sentiment(k.data);
		results[k.symbol][k.type].score=temp.score;
		results[k.symbol][k.type].comparative = temp.comparative;
		results[k.symbol][k.type].year = k.year;
		if(temp.score<0)
		    console.log(k.symbol,k.type,results[k.symbol][k.type]);
	    });
	});
	// console.log(results);
    }
})();

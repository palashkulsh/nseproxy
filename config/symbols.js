var SqlLib = require('../lib/mysqlcon');
var deasync = require('deasync');

module.exports = (function abc(){
  var query='select distinct(symbol) as symbol from stock_data ';
  var res=[];
  var sync=true;
  SqlLib.exec(query, function(err, data){
    if(err){
      return [];
    }
    res=data.map(function(eachData){
      return eachData.symbol;
    });
    sync=false;
  });
  while(sync) {require('deasync').sleep(1000);}
  return res;
})();

var SqlLib = require('../lib/mysqlcon');
var deasync = require('deasync');
let request= require('request');
const csvparse = require('csv-parse/lib/sync');

function getLatestSymbol(){
  let opts={
    uri: 'https://www1.nseindia.com/content/equities/EQUITY_L.csv'    
  }
  let sync=true;
  let result=[], response=[];
  request(opts, function (err, res, body){
    if(err){
      return 
    }
    response=csvparse(body, {columns:true})
    response.forEach(function(el){result.push( el.SYMBOL)})
    sync=false;
  })
  while(sync) {deasync.sleep(1000);}
  return result;
}

module.exports=(function(){
  return getLatestSymbol();
})();

// module.exports = (function abc(){
//   var query='select distinct(symbol) as symbol from stock_data where date between date_sub(curdate() , interval 60 day ) and curdate();';
//   var res=[];
//   var sync=true;
//   SqlLib.exec(query, function(err, data){
//     if(err){
//       return [];
//     }
//     res=data.map(function(eachData){
//       return eachData.symbol;
//     });
//     sync=false;
//   });
//   while(sync) {require('deasync').sleep(1000);}
//   return res;
// })();

(function(){
  if(require.main==module){
    console.log(getLatestSymbol())
  }
})();

var Async = require('async');
var Moment = require('moment');
var Util = require('util');
var request = require('request');
var RateLimiter = require('limiter').RateLimiter;
var Limiter = new RateLimiter(50,'sec'); // limiting to 100 requests per sec
var SqlLimiter = new RateLimiter(20,'sec'); // limiting to 50 requests per sec
var OptionsChainModel = require('../model/options_chain');

let UrlMapping = {
  indices: {
    url:'https://www.nseindia.com/api/option-chain-indices',
    symbols: ['NIFTY','BANKNIFTY']
  },
  stock:{
    url: 'https://www.nseindia.com/api/option-chain-equities',
    symbols: ['ACC','ADANIENT','ADANIPORTS','ADANIPOWER','AMARAJABAT','AMBUJACEM','APOLLOHOSP','APOLLOTYRE','ASHOKLEY','ASIANPAINT','AUROPHARMA','AXISBANK','BAJAJ-AUTO','BAJAJFINSV','BAJFINANCE','BALKRISIND','BANDHANBNK','BANKBARODA','BATAINDIA','BEL','BERGEPAINT','BHARATFORG','BHARTIARTL','BHEL','BIOCON','BOSCHLTD','BPCL','BRITANNIA','CADILAHC','CANBK','CENTURYTEX','CESC','CHOLAFIN','CIPLA','COALINDIA','COLPAL','CONCOR','CUMMINSIND','DABUR','DIVISLAB','DLF','DRREDDY','EICHERMOT','EQUITAS','ESCORTS','EXIDEIND','FEDERALBNK','GAIL','GLENMARK','GMRINFRA','GODREJCP','GODREJPROP','GRASIM','HAVELLS','HCLTECH','HDFC','HDFCBANK','HDFCLIFE','HEROMOTOCO','HINDALCO','HINDPETRO','HINDUNILVR','IBULHSGFIN','ICICIBANK','ICICIPRULI','IDEA','IDFCFIRSTB','IGL','INDIGO','INDUSINDBK','INFRATEL','INFY','IOC','ITC','JINDALSTEL','JSWSTEEL','JUBLFOOD','JUSTDIAL','KOTAKBANK','L&TFH','LICHSGFIN','LT','LUPIN','M%26M','M%26MFIN','MANAPPURAM','MARICO','MARUTI','MCDOWELL-N','MFSL','MGL','MINDTREE','MOTHERSUMI','MRF','MUTHOOTFIN','NATIONALUM','NAUKRI','NCC','NESTLEIND','NIITTECH','NMDC','NTPC','OIL','ONGC','PAGEIND','PEL','PETRONET','PFC','PIDILITIND','PNB','POWERGRID','PVR','RAMCOCEM','RBLBANK','RECLTD','RELIANCE','SAIL','SBIN','SHREECEM','SIEMENS','SRF','SRTRANSFIN','SUNPHARMA','SUNTV','TATACHEM','TATACONSUM','TATAMOTORS','TATAPOWER','TATASTEEL','TCS','TECHM','TITAN','TORNTPHARM','TORNTPOWER','TVSMOTOR','UBL','UJJIVAN','ULTRACEMCO','UPL','VEDL','VOLTAS','WIPRO','YESBANK','ZEEL']
  }
}

function getDataForSymbol(symbol, cb){
  let reqOpts = {
    url: 'https://www.nseindia.com/api/option-chain-equities',
    json: true,
    qs: {
      symbol:symbol
    },
    headers: {
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    }
  };

  //override url in case its nifty or bank nifty
  if(UrlMapping.indices.symbols.indexOf(symbol)>=0){
    reqOpts.url = UrlMapping.indices.url;
  }
  request(reqOpts, function (err, resp, body){
    if (err){
      return cb(err);
    }
    return cb(null, body);
  })
}

function insertDataForSymbol(symbol, cb){
  console.log(`getting data for ${symbol}`)
  getDataForSymbol(symbol, function (err, res){
    if(err){
      return cb(err);
    }
    if(!res || !res.records || !res.records.data || !res.records.data.length){
      return cb(new Error(`no data for ${symbol}`));
    }
    let finalData= [];
    let temp;
    !res.records.data.forEach(function (eachRes){
      ['PE','CE'].forEach(function (eachType){
        if(eachRes[eachType]){
          debugger
          eachRes[eachType].type = eachType;
          eachRes[eachType].datetime = res.records.timestamp;
          //this is reuqired as change is keyword in mysql and cannot
          //have column with that name
          eachRes[eachType]['changes'] = eachRes[eachType]['change'];
          delete eachRes[eachType]['change'];
          eachRes[eachType]['expiryDate'] = Moment(eachRes[eachType]['expiryDate'],'DD-MMM-YYYY').format('YYYY-MM-DD');
          eachRes[eachType]['datetime'] = Moment(eachRes[eachType]['datetime'],'DD-MMM-YYYY hh:mm:ss').format('YYYY-MM-DD hh:mm:ss');
          finalData.push(eachRes[eachType]);
        }
      })
    });
    //now we have finalData
    return OptionsChainModel.insert(finalData, {}, cb);
  });
}

function insertDataForSymbols(symbols, cb){
  Async.eachLimit(symbols, 17, function (symbol, lcb){
    console.log(`each limit for ${symbol}`)
    insertDataForSymbol(symbol, function (err){
      //ignore error
      return lcb();
    });
  }, function finalCb(err){
    if (err){
      return cb(err);
    }
  });
}

function pollOptionsData (){
  let i=0;
  let symbols = UrlMapping.stock.symbols;
  symbols.push.apply(symbols, UrlMapping.indices.symbols);
  setInterval(function (){
    i=1;
    insertDataForSymbols(symbols, function (err){
      if(err){
        //do nothing
      }
      //return done();
    });
  },2*60*1000);
}

(function(){
  if(require.main==module){
    //getDataForSymbol('RBLBANK', console.log)
    //insertDataForSymbol('NIFTY', console.log)
    pollOptionsData()
  }
})();

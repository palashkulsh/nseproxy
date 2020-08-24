var Async = require('async');
var Util = require('util');
var Moment = require('moment');
var request = require('request');
var RateLimiter = require('limiter').RateLimiter;
var Limiter = new RateLimiter(5,'sec'); // limiting to 100 requests per sec
var SqlLimiter = new RateLimiter(20,'sec'); // limiting to 50 requests per sec

const mfsList = require('../config/mfs');
var MfModel = require('../model/mf_details');
// var DateUtils = require('../lib/date_utils');
var debug = require('debug')('api.mf_details');
// var Constants = require('../config/constants');
var SYMBOL_LIMIT = 50;
var RANGE_LIMIT = 10;
var paytmmoneyHeaders = require('../config/paytmmoney_mf_req_headers.js')

//add fund manager and riskometer details

function getDataForIsin(isin, cb){
  var reqOpts = {
    uri: `https://www.paytmmoney.com/api/mf/isin/${isin}`,
    json:true,
    headers: paytmmoneyHeaders,
  }
  Limiter.removeTokens(1,function (err,remainingRequests){
	  request( reqOpts , function (err,res,body){
	    return cb(err, body);
	  });
  });
}

function insertDataForIsin(isin, cb){
  getDataForIsin(isin, function (err, res){
    if (err){
      console.log(`err for ${isin} ${err}`)
      return cb()
    };
    if (!res || !res.data){
      console.log(`got no data for isin ${isin}`)
      return cb();      
    }
    let data=[]
    debugger
    data.push({
      'name': res.data.fundInfo.name,
      'isin': res.data.fundInfo.isin,
      'plan': res.data.fundInfo.plan,
      'expenseRatioPercentage': res.data.fundInfo.expenseRatioPercentage,
      'fundObjective': res.data.fundInfo.fundObjective,
      'exitLoadClause': res.data.fundInfo.exitLoadClause,
      'cashHoldingPercentage': res.data.fundInfo.cashHoldingPercentage,
      'tags': res.data.fundInfo.tags && res.data.fundInfo.tags.map(function (eachTag){return eachTag.displayName}).join(','),
      'assetSize': res.data.fundInfo.assetSize,
      'riskometer': res.data.riskometer.name
    })
    return MfModel.insert(data,{}, cb);
  });
}

function insertDataForIsins(isins, cb){
  Async.eachLimit(isins, SYMBOL_LIMIT, insertDataForIsin, function finalCb(err){
    console.log('all done');
  })
}

(function(){
  if(require.main==module){
    //getDataForIsin('INF846K01131', console.log)
    // insertDataForIsin('INF204K01E88', console.log)
    insertDataForIsins(mfsList, console.log)
  }
})();
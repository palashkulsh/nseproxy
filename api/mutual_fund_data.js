var Async = require('async');
var Util = require('util');
var Moment = require('moment');
var request = require('request');
var RateLimiter = require('limiter').RateLimiter;
var Limiter = new RateLimiter(50,'sec'); // limiting to 100 requests per sec
var SqlLimiter = new RateLimiter(20,'sec'); // limiting to 50 requests per sec

const mfsList = require('../config/mfs');
var MfModel = require('../model/mf_data');
var DateUtils = require('../lib/date_utils');
var debug = require('debug')('api.historical_data');
var Constants = require('../config/constants');
var SYMBOL_LIMIT = 50;
var RANGE_LIMIT = 10;
var paytmmoneyHeaders = require('../config/paytmmoney_mf_req_headers.js')


function getDataForIsin(isin, cb){
  var reqOpts = {
    uri: `https://www.paytmmoney.com/api/mf/isin/${isin}/chart`,
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
    if (!res || !res.data || !res.data.navs|| !res.data.navs.length){
      console.log(`got no data for isin ${isin}`)
      return cb();      
    }
    let data=[]
    !res.data.navs.forEach(function (eachNav){
      data.push({
        date: Moment(eachNav.date).format('YYYY-MM-DD'), //convert to date
        nav: eachNav.value,
        isin: res.data.isin,
        name: res.data.name
      })
    });

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
    //insertDataForIsin('INF846K01131', console.log)
    insertDataForIsins(mfsList, console.log)
  }
})();

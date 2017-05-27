var Async = require('async');
var Util = require('util');
var request = require('request');
var RateLimiter = require('limiter').RateLimiter;
var Limiter = new RateLimiter(5,'sec'); // limiting to 100 requests per sec
var SqlLimiter = new RateLimiter(20,'sec'); // limiting to 50 requests per sec

var htmlparser = require('htmlparser2');
var xpath = require('xpath');
var domutils = require('domutils');
var csvParser = require('csv-parse');
var StockDataApi = require('../model/stock_data');
var DateUtils = require('../lib/date_utils');
var debug = require('debug')('api.historical_data');
var Constants = require('../config/constants');
var SYMBOL_LIMIT = 80;
var RANGE_LIMIT = 10;

function httpsHandler(err, response, body, cb) {
    if(err){
	console.error('to err is human',err);
	return cb(err);
    }
    var htmlHandler = new htmlparser.DefaultHandler(domHandlingFunc);
    var parser = new htmlparser.Parser(htmlHandler,{decodeEntities:true,xmlData:true});
    parser.parseComplete(body);
    ///////////////////////
   function domHandlingFunc(error, dom) {
	if (error){
	    console.log( 'error', error );
	    process.exit(1);
	}
	var csvString = extractData( dom );
	csvStringToJson(csvString,function (err,jsonOutput){
	    if(err){
		Util.log('error converting csv to json',err);
		return cb(err);
	    }
	    return cb(err,jsonOutput)
	});
    }
    /////////////////////////////
}

function newHttpsHandler(err, response, body, cb) {
    if(err){
	console.error('to err is human',err)
	return cb(err);
    }
    var dom = htmlparser.parseDOM(body,{decodeEntities:true,xmlData:true});
    return domHandlingFunc(dom,cb);
}

function domHandlingFunc( dom, cb) {
    var csvString = extractData( dom );
    csvStringToJson(csvString,function (err,jsonOutput){
	if(err){
	    Util.log('error converting csv to json',err);
	    return cb(err);
	}
	return cb(err,jsonOutput)
    });
}

function extractData( dom ){
    var collection = domutils.findOne(function (elem){
	if(elem.name==='div' && elem.attribs && elem.attribs.id==='csvContentDiv'){
	    return true;
	}
    },dom );
    if(collection && collection.children && collection.children[0] && collection.children[0].data){
	return collection.children[0].data;
    }
}

function csvStringToJson(csvString,cb){
    if(!csvString || !csvString.length){
	return cb(null,[]);
    }
    var parseOptions={
	columns:true,
	trim:true,
	rowDelimiter:':',
	auto_parse:true,
	auto_parse_date: true
    };
    csvParser(csvString,parseOptions,cb);
}

/**
 * options.symbol
 * options.fromDate
 * options.toDate
*/
function getHistoricalData(options,cb){
    debug('calling historical data for'+Util.inspect(options));
    var requestObj={
	'url' : 'https://www.nseindia.com/products/dynaContent/common/productsSymbolMapping.jsp',
	'headers': {
	    Host: 'nseindia.com',
	    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:53.0) Gecko/20100101 Firefox/53.0',
	    Accept: '*/*',
	    'Accept-Language': 'en-US,en;q=0.5',
	    // Accept-Encoding: gzip, deflate, br,
	    'X-Requested-With': 'XMLHttpRequest',
	    'Referer': 'https://nseindia.com/products/content/equities/equities/eq_security.htm',
	    'Cookie': 'ys-gridPanel=o%3Acolumns%3Da%253Ao%25253Aid%25253Ds%2525253Aname%25255Ewidth%25253Dn%2525253A139%255Eo%25253Aid%25253Dn%2525253A1%25255Ewidth%25253Dn%2525253A215%255Eo%25253Aid%25253Dn%2525253A2%25255Ewidth%25253Dn%2525253A215%255Eo%25253Aid%25253Dn%2525253A3%25255Ewidth%25253Dn%2525253A323%255Eo%25253Aid%25253Dn%2525253A4%25255Ewidth%25253Dn%2525253A215%5Esort%3Do%253Afield%253Ds%25253Adate%255Edirection%253Ds%25253ADESC; pointer=1; sym1=ADANIPORTS',
	    DNT: 1,
	    Connection: 'keep-alive'	
	},
	qs:{
	    symbol: options.symbol,
	    segmentLink:3,
	    symbolCount:2,
	    series:'ALL',
	    fromDate: options.fromDate,
	    toDate: options.toDate,
	    dataType:'PRICEVOLUMEDELIVERABLE',
	    dateRange:''	// apparently all the options are required when querying even if they are empty
	}
    }
    Limiter.removeTokens(1,function (err,remainingRequests){
	request( requestObj , function (err,res,body){
	    newHttpsHandler(err, res, body,cb);
	});
    });
}

/**
 * takes a date range and symbol and gets data by splitting and calling api repeatedly
 * and inserting the data into stock_data table
   options.fromDate
   options.startDate
   options.symbol
*/
function getAndInsertHistoricalDataOverDateRange (options,cb){
    options.days = options.days || 300;
    var ranges = DateUtils.getDateRangeArray(options.fromDate,options.toDate,options.days,'DD-MM-YYYY','DD-MM-YYYY');    
    if(!ranges || !ranges.length){
	return cb();	
    }
    //inject symbol data in ranges
    ranges.forEach(function (r){
	r.symbol = options.symbol;
    });
    Async.eachLimit(ranges, RANGE_LIMIT,Async.ensureAsync(getAndInsertHistoricalData),function (err,result){
	if(err){
	    Util.log(err);
	}
	return cb();
    });
}

/**
 * rangeOpts.fromDate
 * rangeOpts.toDate
 * rangeOpts.symbol
*/
function getAndInsertHistoricalData(rangeOpts,callback){
    getHistoricalData(rangeOpts,function (err,data){
	if(err){
	    Util.log('error fetching historical data from nse',rangeOpts,err);
	    return callback();
	}
	debug('historical api returned data '+data.length+ ' rows for input '+ Util.inspect(rangeOpts));
	SqlLimiter.removeTokens(1,function (err,remainingTokens){
	    StockDataApi.insert(data,{},function (err,insertResult){
		if(err){
		    Util.log('error inserting data to  stock_data',data,err);
		}
		return callback()
	    });
	});
    });
}

/**
 * rangeOpts.fromDate
 * rangeOpts.toDate
*/

function getAndInsertHistDataForAllStocks(options,callback){
    var allOpts=[];
    var temp={};
    Constants.symbols.forEach(function (eachSymbol){
	temp={};
	temp.fromDate=options.fromDate;
	temp.toDate=options.toDate;
	temp.symbol=eachSymbol;
	temp.days = options.days;
	allOpts.push(temp);
    });
    Async.eachLimit(allOpts,SYMBOL_LIMIT,function (eachOpt,cb){
	debug('processing '+eachOpt.symbol);
	getAndInsertHistoricalDataOverDateRange(eachOpt,cb);	
    },function (err){
	debug('all getAndInsertHistDataForAllStocks');
	return callback();
    });
}

var HistoricalData = {
    getHistoricalData: getHistoricalData,    
};

module.exports=HistoricalData;
(function(){
    if(require.main==module){
	var options={
	    symbol:'pnb',
	    fromDate:'23-05-2017',
	    toDate:'25-05-2017',
	    days:364
	}
	getAndInsertHistDataForAllStocks(options,function (err,result){
	    console.log(err,result)
	    debug('all done');
	    process.exit(0);
	});
    }
})();

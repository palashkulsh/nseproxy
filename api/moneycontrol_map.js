var Async = require('async');
var MoneyControlModel = require('../model/money_control');
var request = require("request");
var parseString = require('xml2js').parseString;
var Path = require('path');
var HistoricalDataApi = require('./historical_data');
var NseGetQuoteModel = require('../model/nse_get_quote');
var Symbols = require('../config/symbols');
var MoneyControlModel = require('../model/money_control');

var MoneyControlApi = {
    getMoneyControlSymbol : function(symbol,cb) {
	console.log(symbol)
	NseGetQuoteModel.getQuote(symbol,function(err,res){
	    if(err)return cb(err);
	    if(!res || !res.data || !res.data[0] || !res.data[0].companyName){
		return cb(new Error('can not get data from nse'));
	    }
	    debugger
	    var companyName=res.data[0].companyName.trim();
	    companyName = companyName.replace(/limited/i,'');
	    companyName = companyName.replace('&','');
	    companyName = companyName.replace(/and/i,'');
	    companyName=companyName.trim().split(" ");
	    if(companyName.length>1){
		companyName[companyName.length-1]='';
	    }
	    companyName = companyName.join(' ');

	    var options = { method: 'GET',
			    url: 'http://www.moneycontrol.com/mccode/common/autosuggesion.php',
			    qs: 
			    { query: symbol, //companyName.toLowerCase(),
			      type: '1',
			      format: 'html',
			      callback: 'suggest' },
			    headers: 
			    { 'postman-token': '0fff6478-74c5-698c-ebb1-26cfcdd52661',
			      'cache-control': 'no-cache',
			      cookie: '__gads=ID=96f0fff59164490e:T=1443434999:S=ALNI_MZOjn_NsbvrblXL5ac5Thj92bM0zg; _em_vt=bda8fcafe5cf3e5cbe88a9186897560911f8f1bdd0-429118155659b769; _gat=1; PHPSESSID=b0rkd7lf3actnc14fm96o53g50; dfp_cookie_floating=Y; stocks=|Zee.Media_ZN~4%7C; crtg_rta=; _ga=GA1.2.434474403.1443434999; mcusrtrk=4',
			      'accept-language': 'en-US,en;q=0.8',
			      referer: 'http://www.moneycontrol.com/india/stockpricequote/media-entertainment/zeemediacorporation/ZN',
			      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36',
			      'x-requested-with': 'XMLHttpRequest',
			      'x-devtools-emulate-network-conditions-client-id': '648FAF7D-AA2F-457C-AF49-7125D77F2F6D',
			      accept: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01' } };
	    request(options, function (error, response, body) {
		body = body.replace(/[\n\r]/g, '\\n')
                    .replace(/&/g,"&amp;")
                    .replace(/-/g,"&#45;");
		if (error) throw new Error(error);
		return parseString(body,function (err,result){
		    if(err){
			return cb(err);
		    }
		    console.log(options,JSON.stringify(result,null,4))
		    if(!result || !result.ul || !result.ul.li || !result.ul.li.length>1 ||!result.ul.li[0] || !result.ul.li[0].a || !result.ul.li[0].a[0] || !result.ul.li){
			return cb(new Error('error while fetching from moneycontrol'));
		    }
		    console.log(symbol,JSON.stringify(result,null,4))
		    var returnOpts,details;
		    result.ul.li.some(function(k){
			if(!k.a || !k.a[0] || !k.a[0].$ ||!k.a[0].$.href || !k.a[0].span || !k.a[0].span[0] || !k.a[0].span[0]){
			    return false;
			}
			if(typeof(k.a[0].span[0])=='object'){
			    details = k.a[0].span[0]._.split(',');
			}else{
			    details = k.a[0].span[0].split(',');
			}
			returnOpts = {
			    mc_symbol: Path.basename(k.a[0].$.href),
			    isin: details[0]?details[0].trim():null,
			    bse: details[2]?details[2].trim():null,
			    symbol: details[1]?details[1].trim():null
			};
			if(!returnOpts.symbol && k.a[0].span[0].font && k.a[0].span[0].font[0] && k.a[0].span[0].font[0].b){
			    returnOpts.symbol=k.a[0].span[0].font[0].b[0];
			}
			if(symbol.toUpperCase()!==returnOpts.symbol.toUpperCase()){
			    returnOpts=null;
			    return false;
			}
			else {
			    return true;
			}
		    });
		    if(!returnOpts){
			return cb(new Error('money control api no match'));
		    }else{
			return cb(null,returnOpts);
		    }
		});
	    });
	});
    },    
}

function insertToTable(cb){
    var symbols=[ 'BIRLAERIC',
  'DUNCANSLTD',
  'ELDERPHARM',
  'ERAINFRA',
  'IVZINGOLD',
  'IVZINNIFTY',
  'JCHAC',
  'LALPATHLAB',
  'LICNETFSEN',
  'LICNFNHGP',
  'MIDCAPIWIN',
  'N100',
  'NV20IWIN',
  'PREMIER',
  'RELNV20',
  'SETF10GILT',
  'SHK' ]
;
    Async.mapLimit(symbols,500,function (symbol,callback){	
	MoneyControlApi.getMoneyControlSymbol(symbol,function (err,returnOpts){
	    var returnData={symbol:symbol}
	    if(err){
		returnData.msg='fail';
		return callback(null,returnData);
	    }
	    MoneyControlModel.insert([returnOpts],{},function (err){
		if(err){
		    returnData.msg='fail';
		    return callback(null,returnData);
		}
		returnData.msg='pass'
		return callback(null,returnData);
	    });
	});
    },function (err,result){
	console.log(result);
    });
}

module.exports= MoneyControlApi;

(function(){
    if(require.main==module){
	var opts={
	    symbol:'PNB',
	    fromDate:'21-09-2016',
	    toDate:'21-09-2016'
	}
	// HistoricalDataApi.getHistoricalData(opts,function (err,result){
	//     console.log(err,result)
	// })
	MoneyControlApi.getMoneyControlSymbol('NV20IWIN',function (err,result){
	    console.log(err,result)
	});
	// insertToTable(console.log);
    }
})();

var request = require("request");

function  getQuote(symbol, cb){
    var options = { method: 'GET',
		    url: 'https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/ajaxGetQuoteJSON.jsp',
		    qs: { symbol: symbol },
		    headers: 
		    { 'postman-token': '0fcd6fc3-d1db-e512-5da3-72df04e3df1d',
		      'cache-control': 'no-cache',
		      cookie: '__gads=ID=96f0fff59164490e:T=1443434999:S=ALNI_MZOjn_NsbvrblXL5ac5Thj92bM0zg; _em_vt=bda8fcafe5cf3e5cbe88a9186897560911f8f1bdd0-429118155659b769; _gat=1; PHPSESSID=b0rkd7lf3actnc14fm96o53g50; dfp_cookie_floating=Y; stocks=|Zee.Media_ZN~4%7C; crtg_rta=; _ga=GA1.2.434474403.1443434999; mcusrtrk=4',
		      'accept-language': 'en-US,en;q=0.8',
		      referer: 'http://www.moneycontrol.com/india/stockpricequote/media-entertainment/zeemediacorporation/ZN',
		      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36',
		      'x-requested-with': 'XMLHttpRequest',
		      'x-devtools-emulate-network-conditions-client-id': '648FAF7D-AA2F-457C-AF49-7125D77F2F6D',
		      accept: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01' } };

    request(options, function (error, response, body) {
	if (error) throw new Error(error);
	var returnObj;
	try{
	    returnObj=JSON.parse(body);
	}catch(e){
	    return cb(e);
	}
	return cb(null,returnObj)
    });
}

var GetQuoteApi = {
    getQuote: getQuote
};

module.exports=GetQuoteApi;

(function(){
    if(require.main==module){
	getQuote('SBIN',console.log)
    }
})();

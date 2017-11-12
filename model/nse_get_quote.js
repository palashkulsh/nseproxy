var request = require("request");

/**
 * this function is prone to expiring cookies , then you need to re collect the cookie after some time
 * */
function  getQuote(symbol, cb){
    var options = { method: 'GET',
		    url: 'https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/ajaxGetQuoteJSON.jsp',
		    qs: { symbol: symbol },
		    headers: {
                      Host: 'www.nseindia.com',
                      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:53.0) Gecko/20100101 Firefox/53.0',
                      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                      'Accept-Language': 'en-US,en;q=0.5',
                      'Referer': 'https://www.google.co.in/',
                      'Cookie': 'pointer=1; sym1=LT',
                      'DNT': 1,
                      'Connection': 'keep-alive',
                      'Upgrade-Insecure-Requests': 1,
                      'Cache-Control': 'max-age=0',
                    }
                    
                  };

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

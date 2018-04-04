
var StockDataModel = require('../model/stock_data');

var StockDataApi = {
    insert: StockDataModel.insert,
    getAllSymbols: function(cb){	
	var query = 'select distinct symbol from stock_data where date="2018-04-02" order by symbol';
	StockDataModel.get(query, function (err, result){
	    if(err){
		return cb(err);
	    }
	    if(!result || !result.length){
		return cb(null,[]);
	    }
	    var symbols = result.map(function(eachResult){
		return eachResult.symbol;
	    });
	    return cb(null, symbols);
	});
    }
};

module.exports=StockDataApi;

(function(){
    if(require.main==module){
	StockDataApi.getAllSymbols(console.log)
    }
})();

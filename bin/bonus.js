var debug = require("debug")('bin.bonus');
var debugFlow = require("debug")('flow.bin.bonus');

var util = require("util");
var Async = require("async");
var request = require("request");
var tabletojson = require('tabletojson');
var SqlLib = require('../lib/mysqlcon');
var moment = require('moment');

var tableToSystemMap = {
    '1': 'ratio',
    '2': 'announcement',
    '3': 'record',
    '4': 'ex_bonus',    
}

function initMcToSymbolMap(cb){
    debugFlow('initMcToSymbolMap');
    var query = 'select symbol,mc_symbol from symbol_mc_map';
    SqlLib.exec(query,function cb1(err, res) {
        debugFlow('cb1');
        if(err){
	    debug(err);
            return cb(err);
        }
        var map={};
        res.forEach(function cb2(eachres) {
            debugFlow('cb2');
            map[eachres.mc_symbol] = eachres.symbol;
        });
        return cb(null, map);
    });
}

function getBonusForYear(year,cb){
    debugFlow('getBonusForYear');
    debug('calling bonus for year '+year);
    var options = { method: 'GET',
		    url: 'http://www.moneycontrol.com/stocks/marketinfo/bonus/homebody.php',
		    qs: { sel_year: year },
		    headers: 
		    { 'postman-token': 'f83cb2fb-8ded-195f-f1d2-d137eb98ddd2',
		      'cache-control': 'no-cache' } };

    request(options, function cb3(error, response, body) {
        debugFlow('cb3');
        if (error) {
	    return cb(error)
	};
        debug('gotData for year '+year);
        return cb(null,body);
    });
}

function getTables(html,cb){
    debugFlow('getTables');
    var tablesAsJson = tabletojson.convert(html);
    return cb(null,tablesAsJson);
}

function insertToBonusTable(data,cb){
    debugFlow('insertToBonusTable');
    var insertData=[];
    if(!util.isArray(data)){
	insertData = [data];
    }else{
	insertData = data;
    }
    Async.eachLimit(insertData,1,function cb4(eachData, lcb) {
        debugFlow('cb4');
        var query = util.format('insert into bonus (symbol,bonus_share,holds_share,record,announcement,ex_bonus) values ("%s","%s","%s","%s","%s","%s")',eachData.symbol,eachData.bonus_share,eachData.holds_share,eachData.record,eachData.announcement,eachData.ex_bonus);
        debug(query);
	if(eachData.symbol=='MINDACORP')
	    debugger
        SqlLib.exec(query,function cb5(err) {
            debugFlow('cb5');
            if(err){
		debug(err.toString());
	    }
            return lcb();
        });
    },function (err){
	if(err){
	    debug(err);
	}
	return cb();
    });
}

function fetchBonus(year,cb){
    debugFlow('fetchBonus');
    getBonusForYear(year,function cb6(err, html) {
        debugFlow('cb6');
        if(err){
            debug(err);
            return cb(err);
        }
        getTables(html,function cb7(err, data) {
            debugFlow('cb7');
            if(err){
		return cb(err);
            }
            initMcToSymbolMap(function cb8(err, map) {
                debugFlow('cb8');
                if(err){
                    return cb(err);
                }
                var newData = [];
                data.forEach(function cb9(eachTable) {
                    debugFlow('cb9');
                    eachTable.forEach(function cb10(k) {
                        debugFlow('cb10');
                        var temp={};
                        if(!k.mc_symbol || !map[k.mc_symbol]){
                            return;
                        }
                        temp.symbol = map[k.mc_symbol];
                        Object.keys(tableToSystemMap).forEach(function cb11(key) {
                            debugFlow('cb11');
                            if(k[key]){
                            temp[tableToSystemMap[key]]=k[key];
                            }
                        });
                        temp.bonus_share=temp.ratio.split(':')[0];
                        temp.holds_share=temp.ratio.split(':')[1];
                        temp.announcement = moment(temp.announcement,'DD-MM-YYYY').isValid() && moment(temp.announcement,'DD-MM-YYYY').format('YYYY-MM-DD');
                        temp.record = moment(temp.record,'DD-MM-YYYY').isValid() && moment(temp.record,'DD-MM-YYYY').format('YYYY-MM-DD')
                        temp.ex_bonus = moment(temp.ex_bonus,'DD-MM-YYYY').isValid() && moment(temp.ex_bonus,'DD-MM-YYYY').format('YYYY-MM-DD');
                        newData.push(temp);
                    });
                });
                return cb(null, newData);
            });
        });
    });
}

function fetchAndInsertForYear(year, cb){
    debugFlow('fetchAndInsertForYear');
    Async.waterfall([
	Async.constant(year),
	fetchBonus,
	insertToBonusTable
    ],function (err){
	return cb(err);
    });
}

function fetAndInsertForAllYears(cb){
    debugFlow('fetAndInsertForAllYears');
    var years= [];
    for(i=2016;i<2018;i++){
	years.push(i);
    }
    Async.eachLimit(years,10,function cb12(year, lcb) {
        debugFlow('cb12');
        fetchAndInsertForYear(year,lcb);
    },cb);
}

((function cb13() {
    debugFlow('cb13');
    if(require.main==module){	
	fetAndInsertForAllYears(function cb14(err) {
            debugFlow('cb14');
            console.log(arguments,'alldone');
	});
    }
}))();

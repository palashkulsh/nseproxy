/**
 * when script starts to hang then just call the api in the browser and 
 * change its cookies
*/

var request = require('request');
var rjson = require('relaxed-json');
var html_tablify = require('html-tablify');
var fs = require('fs');
var async = require('async');
const cheerio = require('cheerio');

var LIMIT=5;
var RETRY = 0;

var exclusion = ['Interest payment','Trading Window closure','Credit Rating','Analysts/Institutional Investor Meet/Con',' Regulation 74(5)', 'Regulation 30', 'lodr', 'Trading Plan', 'Postal Ballot', 'Change in Director', 'Board meeting', 'Certificate', 'sast', 'notice of'];

function looseJsonParse(obj){
  obj = obj.trim();
  return rjson.parse(obj);
  //return Function('return (' + obj + ')')();
}

function getAnnouncementData(url, cb){
  if(!url){
    return cb(null, {});
  }
  var options = {
    method: 'GET',
    uri: url,
    timeout: 10000,
    headers:{
      Host: 'www1.nseindia.com',
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      Cookie: 'JSESSIONID=FEFB4A0597F86022BA4C4D13E45E9D19.jvm1; NSE-TEST-1=1910513674.20480.0000; ak_bmsc=185AF4C81D8E3DFCE6E242DD8D57E12B75EF8D6F657800009160085F1E0E2412~plm2HW1CyJK6nr4SrPY5AnLSUnEFbcoU22J9FyNwkzch5Iqul3KJRGfEXKFX2cIwL/AwF9mzimo4NBNVFgXlxLzbLKw1xx/tvewBcG+jG9e3Oi7uItNIizrGAUfo3LUb++wqGqkzs/ZT3MEOnvn6A2YzX9A8AeVbjLhkIMji/PAGFu5WRBEzk+K4UgbAdB2JvC+jo7iAE9ZvgG13TgiYjFEIaG3uRXOV6qmoOSymzkE7JVlLd6wMTqoLV9tXmZvjKc; bm_mi=5131B954BDAF63989C08A168654B954F~GWVZRj3hMoRYGhPX4ciClGXIn+R4gBnw+VbcMuTCeT3wlr5OJPNL3+K1CGVTup0BXMDJ2CMyDRzt00jPA35e8+6NwiuSHBOl6ajCuO4hMeS1ZEY2yRb9ig6XQYlfHd1EcA859FHtyV/UYmohmSxcejSIg84CyQw30XCQrABx7Cv5NHk61zyOf6tZhsH+Rnk6bJ5xXbKsUNCKRXnC8ZfwT8RyrEEEVp4Eo+ZiEHsOnWEVGVoGrFDz49+GoWh5ECkjOBHzZxA5pfkDZw7+2g2u+SKpLHhGrSEfW+yXzu4rT0cvO/KfsItFGGuMuAbbxgOzyjdly1g0IiUf24DytwiRrGEz7dBSyoaQWvvZ7VkHZqQ=; bm_sv=92DEECF237C695527580FBB354E0EB73~OXDoBlkp9urRLw9/2bshr4teJmZkz1Mp3UINlf+tepVV0JoM8rwUOvbhw5Ln2Ct2M/4gFa25OcI1NW8Cc86d4kBEvYaGCQ29aSfAZB7Qp3gAyr7iiRfTCeCZn/TsTguqxgOlPGHFWYpG7ohEQu7pZUZxzdFPUBPGeaG4U1f/9JU=',
        'Pragma':'no-cache',
      'Upgrade-Insecure-Requests': 1,
      'Cache-Control': 'no-cache'
    }
  };
  console.log('getting announcementData ',url)
  request(options, function (error, response, body) {
    console.log('got getAnnouncementData')
    if (error) {
      console.log(error)
      return cb(error)
    };
    const $ = cheerio.load(body);
    let url , details;
    $('table.viewTable:nth-child(5) > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(2) > a:nth-child(1)').each(function(i, elem){
      url = $(this).attr('href');
      url = ''+url;
    });
    $('table.viewTable:nth-child(5) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2) ').each(function(i, elem){
      details = $(this).text();
    });
    
    return cb(null ,{url:url, details: details})
  });
}

function getDataParallel(options, cb){
  let failed=0;
  getData({offset:options.offset, limit:options.limit}, function (err, body){
    if(err){
      return cb(err);
    }
    let arr = [];
    for(let i=0;i<=body.results;i+=options.limit){
      arr.push(i);
    }
    let finalData = [];
    async.eachLimit(arr, LIMIT, function (eachArr,lcb){
      async.retry(RETRY, getData.bind(null ,{offset: eachArr, limit: options.limit} ), function(err, data){
        if(err){
          failed++;
          return lcb();
        }
        finalData.push.apply(finalData, data.rows);
        return lcb(null);
      });
    }, function (err){
      if(err){
        return cb(err);
      }
      console.log('total failed '+failed);
      //exclude on basis of exclusion list
      let clonelist = [];
      finalData.forEach(function(eachdata){
        exclusion.forEach(function(eachex){
          let reg = new RegExp(eachex,"ig");
          if(eachdata.details && eachdata.details.match(reg)){
            eachdata.exclude=1;
          }
        });
        if(!eachdata.exclude){
          clonelist.push(eachdata);
        }
      });
      return cb(null, clonelist);
    })
  });
}

function getData (options, cb){
  let opts = {
    uri: 'https://www1.nseindia.com/corporates/directLink/latestAnnouncementsCorpHome.jsp?start='+options.offset+'&limit='+options.limit,    
    method:'GET',
    headers: {
      Host: 'www.nseindia.com',
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:66.0) Gecko/20100101 Firefox/66.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5'          ,
      Referer: 'https://www.nseindia.com/corporates/common/announcement.htm',
      'X-Requested-With': 'XMLHttpRequest',
      Connection: 'keep-alive',
      Cookie: 'JSESSIONID=0A80F6093B3F1D38A4DE4815394204D2.jvm1; NSE-TEST-1=1910513674.20480.0000; ak_bmsc=185AF4C81D8E3DFCE6E242DD8D57E12B75EF8D6F657800009160085F1E0E2412~plPIMPFCLGcApUNFKMCgShyQWoJhwef47PNTAGzsAiPhtgQa0OsLepw1T/q4cA5KqTHUd5UmTM/+hFDn8W0O3o7kkLH0b4CErFtlEd35FOPTrezZpdkSQIoZ50cactZ0Nnjpnsvks1F82V8aOgLgpgh3Nb54vtzGRfogMvsEiopxG33LRswbtOMaDJd1jNY+rXbgYwhfOlv9YgsTT+c+DMFFL7o8j8+WArhcPDuA2fPJ8=; bm_mi=5131B954BDAF63989C08A168654B954F~GWVZRj3hMoRYGhPX4ciClGXIn+R4gBnw+VbcMuTCeT3wlr5OJPNL3+K1CGVTup0Bk6WQ73hHc+sz4ijqxhHfTSvJZtKSFJs+MspJJvbY44z1zpOPKU99vXkLMPEGhl8BjTpBKKfGca3HgOJfGiQcU5DFWX0Pf13CdPPRNY6p5xJzf/m+Fb0dovuR87HIjPlcgTjpkz17i4/wkC3C6ZAahMjMI27SxPJkaaFGs46RcUQE3c19ooq2fo6+VxCIIFEoePi3l1DZ0LARQ9AwuXev2ISfmgybYzyaSN5oHkKkqtw=; bm_sv=92DEECF237C695527580FBB354E0EB73~OXDoBlkp9urRLw9/2bshr4teJmZkz1Mp3UINlf+tepVV0JoM8rwUOvbhw5Ln2Ct2M/4gFa25OcI1NW8Cc86d4kBEvYaGCQ29aSfAZB7Qp3ibKSDvqeo7GEH++sBmziWMc+pJJ6koL8rc0WdmhSZwW7Uk5uJn5cEoevmXROROlPs=',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache'
    },
    json:true
  }
  
  console.log('getting data for '+opts.uri)
  console.log('getting data for '+options.offset);
  request(opts,function (err, res, body){
    console.log('got data '+options.offset);
    if(err || !body){
      return cb(err || 'no body');
    }
    try{
      //body = eval('(' + body + ')');
      body = looseJsonParse(body);
    }catch(ex){
      console.log('failed '+options.offset)
      return cb(ex);
    }
    async.eachLimit(body.rows,LIMIT, function (eachRow, lcb){
      console.log('inside eachLimit iterator')
      //eachRow.link = '<a href="https://www.nseindia.com'+ eachRow.link+'">'+eachRow.desc+'</a>'
      eachRow.link = 'https://www1.nseindia.com'+eachRow.link
      getAnnouncementData(eachRow.link, function (err, data){
        eachRow.company = eachRow.company+' '+eachRow.symbol;
        delete eachRow.symbol;
        delete eachRow.date;
        delete eachRow.link

        if(!data) return lcb();
        eachRow.attachment = '<a href="https://www1.nseindia.com'+ data.url+'">link</a>' ;
        eachRow.details = data.details;
        return lcb();
      });
      
    }, function finalCb(){
      return cb(null, body);
    });
  });
}

function getAllData(cb){
  let limit=20,offset=0,total=0;
  let data= [];
  async.doWhilst(function iterator(callback){
    getData({limit:limit,offset:offset}, function (err, body){
      if(err || !body){
        return cb(err || 'no body');
      }

      total = body.results;
      offset += limit;
      data.push.apply(data, body.rows);
      console.log(data.length)
      return callback();
    })
  }, function test(){
    return offset < total;
  }, function finalCb(){
    return cb(null, data)
  });
}


function writeToFile(cb){
  getDataParallel({offset:0,limit:20},function (err, data){
    if(err){
      console.log(err);
      return cb(err)      ;
    }
    console.log('All parallel data rx');

    let options = {
      data: data,
      css: 'table {border: 1px solid red}'
    };
    let filename = '/tmp/corporate.html';
    let html_data = html_tablify.tablify(options);
    fs.readFile(__dirname+'/../config/search.html', function (err, contents){
      contents = contents || '';
      html_data = contents.toString()  + html_data;
      fs.writeFile(filename, html_data, function (err){
        if(err)return cb('err writing to file');
        console.log('written to file '+filename)
        return cb();
      })

    })
  });
}

module.exports= getData;
(function(){
  if(require.main==module){
    //getDataParallel({limit:20, offset:0},console.log);
    //getAllData(console.log)
    writeToFile(console.log)
    //getAnnouncementData('https://www.nseindia.com/corporates/corpInfo/equities/AnnouncementDetail.jsp?symbol=INTEGRA&desc=Trading+Window&tstamp=030420191832&seqId=103421902&')
  }
})();

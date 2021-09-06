/**
 * when script starts to hang then just call the api in the browser and 
 * change its cookies
*/

var request = require('request');
const { exec } = require("child_process");
var rjson = require('relaxed-json');
var html_tablify = require('html-tablify');
var fs = require('fs');
var async = require('async');
var NseApiModel = require('../model/nse_api');
const cheerio = require('cheerio');


var LIMIT=1;
var RETRY = 0;

var exclusion = ['Interest payment','Trading Window closure','Analysts/Institutional Investor Meet/Con. Call Updates','Credit Rating',' Regulation 74(5)', 'Regulation 30', 'lodr', 'Trading Plan', 'Postal Ballot', 'Change in Director', 'Board meeting', 'Certificate', 'sast', 'notice of'];

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

    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:79.0) Gecko/20100101 Firefox/79.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
      'Cookie': '_ga=GA1.2.1464035869.1595747215; RT=z=1&dm=nseindia.com&si=325c692f-31e5-4dde-867c-d192ee5f40da&ss=ke8q1dj0&sl=0&tt=0&bcn=%2F%2F684fc53f.akstat.io%2F&ul=58ln1&hd=58lrr; ak_bmsc=B3DD7DD2EDC9C1896E5D21C7F2BF1BF175EF5B57C02D00003B1E4A5F6A55FE34~plaZTRW4saRWxj8keYXYKe4jQwApo3dMyWa8Xi1VZk+1lpGyFJLjEI8r8syR4SHSRkqYDgw1/vBpehrvXrn9D1gxZ4QlfL6VlTiTEctB09NXVhHSDMsQBYsfIvH9DQuMApZAP4jm9tPwcweJsE5jTFo6Iy6NX77qIvSmjeKvdRLj0GIGQcvpjd1BtuVGH1KG4BGycwqiznVuP5CCApbn5SfTUpg6dRRBHBP/edDcQdHdpCjtkbC5wy81UAFNVjiMgS; bm_mi=E2CC878EB265BA2AE1E90676289C03AD~i2JRnRXtTJB8Jh+pc+D/qzoUCEdOLbZt8X1I8VlFMABSJ6ndKlGnCv5c5KlP3g9WGkilsJPyRnDDS6CGis1pQSx5tQc6ztGr2esmlNLwggLe0+MxZWP6mZuZxnqIUhRGnYtkoYkcGQC9IAc9Tj+7VloY5H5UN3fzIX4KVGczR+WffYBSXb7NcsvfoSvSi3u03LIoYfILL2YcOY1xjVlfcGh9fV+qYCiqFtLhh9ZrRwntlKrgEBstkM+NVW66HhY7b3YiOkBj4njQ6XNUvVfOALnVZsl/rWTnCPOUK8qFEcJezESP2iglvD11wOWec5RGQ3lhqzyozTWZ3uyJSlUdkv9djh7oqv++qc13HZKT+3w=; bm_sv=BB5A3207778D43925748909B17BF58D3~uGjSXoc7AFCG1g2mDAKzw6cBnG7gvWjdhpfRhPKRuLMvXf7TSTH2xH02Ll0O8dW7EqOiaqQYdqKEPDTW6WxWuTCNg0DmRck1oHOErklTWPanfPrd4hI6NzCW7riAlILsFYK0aBgxlnNAba4gfzObZfJeGRLRrR8nRQ+RAx3zQwU=; JSESSIONID=FA9A2453F9CE3DDFD61AA2DDE620DDCF.tomcat2; NSE-TEST-1=1927290890.20480.0000'
    }
  };
  console.log('getting announcementData ',url)  
  
  let cookiefile = `/tmp/cookie_${Date.now()}.txt`
  exec(`curl -s -b ${cookiefile} -c ${cookiefile} '${url}' -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:81.0) Gecko/20100101 Firefox/81.0' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Accept-Language: en-US,en;q=0.5' --compressed -H 'Connection: keep-alive' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache'`, {maxBuffer: 1024*1024*1024}, (error, body, stderr) => {

    console.log('got getAnnouncementData')
    if (error || stderr) {
      console.log(error || stderr)
      return cb(error || stderr)
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
      
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:79.0) Gecko/20100101 Firefox/79.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'Cookie': '_ga=GA1.2.1464035869.1595747215; RT=z=1&dm=nseindia.com&si=325c692f-31e5-4dde-867c-d192ee5f40da&ss=ke8q1dj0&sl=0&tt=0&bcn=%2F%2F684fc53f.akstat.io%2F&ul=58ln1&hd=58lrr; ak_bmsc=B3DD7DD2EDC9C1896E5D21C7F2BF1BF175EF5B57C02D00003B1E4A5F6A55FE34~pliXQ5HPjjgT4ypvyWamYkqsCEDbqFQEgraNjNzaQuOfsAPnmckpmuLY1s7RlYOXtKpuGZ5Kyowlxd2oSwfZJr3zEDOfdZhZ6wfAJZwc3qTC86/cOZZCLEoxhkmM68THPisd4Ae5dFA4/D6OszYNLCI9HCoXJcC1IktY2sG6Nat9R99oe+bsUsuj9S3Oatiq0e5VSQqU1qETEoj+O4OjzvDbhhzrMiC2u9IQ8hYc+06LY='

    },
    json:true
  }
  
  console.log('getting data for '+opts.uri)
  console.log('getting data for '+options.offset);
  let cookiefile = `/tmp/cookie_${Date.now()}.txt`
  exec(`curl -s -b ${cookiefile} -c ${cookiefile} 'https://www1.nseindia.com/corporates/directLink/latestAnnouncementsCorpHome.jsp?start=${options.offset}&limit=${options.limit}' -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:81.0) Gecko/20100101 Firefox/81.0' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Accept-Language: en-US,en;q=0.5' --compressed -H 'Connection: keep-alive'  -H 'Pragma: no-cache' -H 'Cache-Control: no-cache'`, {maxBuffer: 1024*1024*1024}, (error, body, stderr) => {
    console.log('got data '+options.offset);
    if(error || !body || stderr){
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
    
      })
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

var request = require('request');
var rjson = require('relaxed-json');
var html_tablify = require('html-tablify');
var fs = require('fs');
var async = require('async');
const cheerio = require('cheerio');

var LIMIT=7;
var RETRY = 0;

function looseJsonParse(obj){
  obj = obj.trim();
  return rjson.parse(obj);
  //return Function('return (' + obj + ')')();
}

function getAnnouncementData(url, cb){
  debugger
  if(!url){
    return cb(null, {});
  }
  var options = {
    method: 'GET',
    url: url,
  };
  request(options, function (error, response, body) {
    if (error) return cb(error);
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
  getData({}, function (err, body){
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
      return cb(null, finalData);
    })
  });
}

function getData (options, cb){
  let opts = {
    uri: 'https://www.nseindia.com/corporates/directLink/latestAnnouncementsCorpHome.jsp?start='+options.offset+'&limit='+options.limit,
    method:'GET',
    headers: {
      Host: 'www.nseindia.com',
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:66.0) Gecko/20100101 Firefox/66.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5'          ,
      Referer: 'https://www.nseindia.com/corporates/common/announcement.htm',
      'X-Requested-With': 'XMLHttpRequest',
      Connection: 'keep-alive',
      Cookie: '_ga=GA1.2.235072312.1551891946; RT="sl=0&ss=1554054141941&tt=0&obo=0&sh=1554310264314%3D1%3A0%3A3836&dm=nseindia.com&si=21884bfe-a0ac-4705-a3d6-39ae206dd5bf&bcn=%2F%2F17d98a5d.akstat.io%2F&rl=1"; pointerfo=2; underlying1=RELIANCE; instrument1=OPTSTK; optiontype1=CE; expiry1=; strikeprice1=1360.00; underlying2=HINDUNILVR; instrument2=OPTSTK; optiontype2=CE; expiry2=; strikeprice2=1680.00; JSESSIONID=FAD0025E00BD6FD0539BA5BFD78F3E7D.tomcat2; NSE-TEST-1=1910513674.20480.0000; ak_bmsc=7B6E5273D2FCF95A0CD0623FC8692AC6174C9C767B430000FAFBA45CB8770805~plxp2+Q3Q6f0/aKH3zkEaWmo0VdxMK1U3eQsV00Fa7+FMzWbQtBjMoFHsR0YwFW7eNukmIxuAbSEQacB1EIkYKP7VGpMX+4MibrUXQ71exxAela5B5uCLhOCDvTfX/4EsHWs1RHrIXHcWQQbaVZmcczU3UElj5BEPMciKfCGg3vCdZiK98ISe3bAV6LcSC0Gjz4DCt4PGwCpCaGRAXccBioFKJOiyG2ry4OHe8Y40OUjr+YMOHfy7oPzKH9pJmxAgSlQ+oCB9G3I55DTJqzJBohA==; bm_sv=F1112716684D23895B202A047B57A512~dRy0Os6R1FU+gRYmSD5rOzS1I3U0WQXkryxRD68K/iYamFYcmEMNroLfIsiBZgJu1/3Ma9yuosxxDkf9acG9vtKd55JCQix+UPRsEw/7EwcEoJh/FmBEfRxFUylT4wXp1F8tvZMyzhZIMJnYorwQNGuFy2G23I1Zd9ugAzBM+3I=; bm_mi=279A3E5B775C43F2CB1CB47422A7CDAE~2Kv1+kRX5PeGSqwlNR1e4+KF7c8lvchkIiF1xk4WUP0vkEOQKSKEHgRwBgfzS4mCd2n7b+A5KAdhH+tdDQFNfyjwsuYl/OUAbHTqz0c7uxHFzdYphGuXzQQ4Rc7SkdIh9btiKkj4H7FSDm63cQN8n9v2Qac7dkaDg/wJEijICM+dheGI+Gdif00AExmbfd/rdenB6GF6y+Cr5DsIKqQ1q7LY5qwp5smx1gZRcvxdvGty4EALVhVagLrd0JvgBYCglQdMM63HI1YhVpgQs0cTMh7T/m4kjV3vV+Uf5BfrI/dWBHazcjsov8wOSl+alx/f0CRDS91XVNPF23aUFx2KWg==',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
    },
    json:true
  }
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
    async.eachLimit(body.rows,7, function (eachRow, lcb){
      //eachRow.link = '<a href="https://www.nseindia.com'+ eachRow.link+'">'+eachRow.desc+'</a>'
      debugger
      eachRow.link = 'https://www.nseindia.com'+eachRow.link
      getAnnouncementData(eachRow.link, function (err, data){
        eachRow.company = eachRow.company+' '+eachRow.symbol;
        delete eachRow.symbol;
        delete eachRow.date;
        delete eachRow.link

        if(!data) return lcb();
        eachRow.attachment = '<a href="https://www.nseindia.com'+ data.url+'">link</a>' ;
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
    if(err)return cb(err);
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

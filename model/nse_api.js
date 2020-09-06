const { exec } = require("child_process");

async function callNse(opts){
  let url=opts.url;
  console.log(url)
  return new Promise(function (resolve,reject){
    exec(`curl -s '${url}' -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:79.0) Gecko/20100101 Firefox/79.0' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Accept-Language: en-US,en;q=0.5' --compressed -H 'Connection: keep-alive'  -H 'Upgrade-Insecure-Requests: 1' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' -H 'TE: Trailers'`, {maxBuffer: 1024*1024*1024}, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return reject(stderr);
      }
      // console.log(`stdout: ${stdout}`);
      stdout = JSON.parse(stdout);
      return resolve(stdout)
    });
  })
}

module.exports={
  callNse
};

(async function(){
  if(require.main==module){
    let data=await callNse({url:'https://www.nseindia.com/api/historical/cm/equity?&symbol=AARTIDRUGS&series=[%22EQ%22]&from=20-08-2020&to=29-08-2020'})
    console.log(data)
  }
})();

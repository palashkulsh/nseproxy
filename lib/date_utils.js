var moment = require('moment');

function getNseDateFormat(dateString){
    var d=moment(dateString);
    return d.format('DD-MM-YYYY');
}

/**
input : startDate: '2016-10-10'
endDate: '2016-10-20'
days: 3
outFormat:'DD-MM-YYYY'

[ { fromDate: '10-10-2016', toDate: '13-10-2016' },
  { fromDate: '14-10-2016', toDate: '17-10-2016' },
  { fromDate: '18-10-2016', toDate: '20-10-2016' } ]

*/
function getDateRangeArray(startDate,endDate,days,outFormat,inFormat){
    var outFormat = outFormat || 'YYYY-MM-DD';
    var inFormat = inFormat || 'YYYY-MM-DD'
    var start = moment(startDate,inFormat);
    var temp = moment(startDate,inFormat);
    var end = moment(endDate,inFormat);
    var rangeArr=[];
    var tempObj={};
    while(temp<end){
	tempObj={};
	tempObj.fromDate=temp.format(outFormat);
	tempObj.toDate = moment.min(temp.add(days,'day'),end).format(outFormat);
	temp.add(1,'day');	// so that date ranges dont overlap
	rangeArr.push(tempObj);
    }
    return rangeArr;
}
module.exports={
    getNseDateFormat:getNseDateFormat,
    getDateRangeArray:getDateRangeArray
};

(function(){
    if(require.main==module){
	console.log(getNseDateFormat('2016-10-11'))
	console.log(getDateRangeArray('2016-10-10','2016-10-20',3,'DD-MM-YYYY'));

    }
})();

var Util= require('util');

var DataUtils = {
    multiArray: function (arr,size){
	var multiArr=[];	
	if(size && Util.isArray(arr)){
	    for(var i=0;i<arr.length;i+=size){
		multiArr.push(arr.slice(i,i+size));
	    }
	}
	return multiArr;
    }
};

module.exports=DataUtils;

(function(){
    if(require.main==module){
	console.log(DataUtils.multiArray([1,2,3,4,4,5,6,7,87,8],0));
    }
})();

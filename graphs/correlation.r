library(RMySQL)
library(ggplot2)
library(parallel)
#plotting a single graph


findDataForSymbol<- function(symbol1){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-sprintf("select * from stock_data where symbol='%s'",symbol1)
f<-dbSendQuery(con,query);
data<-fetch(f,n=-1);#n=-1 fetches all pending records
return(data);			  
}

findCorrelation<- function(symbol1,symbol2){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-sprintf("select sd1.date,sd1.average_price as sd1_price,sd2.average_price as sd2_price  from stock_data as sd1 inner join stock_data as sd2 on sd1.date=sd2.date where sd1.symbol='%s' and sd2.symbol='%s' and sd1.series='EQ' and sd2.series='EQ'",symbol1,symbol2);
print(query);		     
f<-dbSendQuery(con,query);
data<-fetch(f,n=-1);#n=-1 fetches all pending records
return( cor(data$sd1_price,data$sd2_price));			    
}


findPairWiseData<- function(symbol1,symbol2){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-sprintf("select sd1.date,sd1.average_price as sd1_price,sd2.average_price as sd2_price  from stock_data as sd1 inner join stock_data as sd2 on sd1.date=sd2.date where sd1.symbol='%s' and sd2.symbol='%s' and sd1.series='EQ' and sd2.series='EQ'",symbol1,symbol2);
print(query);		     
f<-dbSendQuery(con,query);
data<-fetch(f,n=-1);#n=-1 fetches all pending records
data$date<-as.Date(data$date);
return( data);			    
}


findCrossCorrelation<- function(symbol1,symbol2){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-sprintf("select sd1.date,sd1.average_price as sd1_price,sd2.average_price as sd2_price  from stock_data as sd1 inner join stock_data as sd2 on sd1.date=sd2.date where sd1.symbol='%s' and sd2.symbol='%s' and sd1.series='EQ' and sd2.series='EQ'",symbol1,symbol2);
print(query);		     
f<-dbSendQuery(con,query);
data<-fetch(f,n=-1);#n=-1 fetches all pending records
return( ccf(data$sd1_price,data$sd2_price));			    
}


findAllSymbols<- function(){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-"select distinct symbol from stock_data"
print(query);		     
f<-dbSendQuery(con,query);
data<-fetch(f,n=-1);#n=-1 fetches all pending records
return (data);
}

findPairwiseCorrelation<-function(){
symbols<-findAllSymbols();
symbols<-symbols$symbol
corMat<-data.frame(row.names=symbols)
for(s1 in 1:length(symbols)){
       for(s2 in s1:length(symbols)){
       	      corData<-findCorrelation(symbols[s1],symbols[s2])
	      corResult<-cor(corData$sd1_price,corData$sd2_price)
	      print(sprintf("s1=%s,s2=%s,cor=%s",symbols[s1],symbols[s2],corResult));	      
	      corMat[symbols[s1],symbols[s2]]<-corResult;
       }       
}
return (corMat)    ;
}

findCorrelationWithAll<-function(symbol,symbols){
    seen<-FALSE;
    corResultArray<-list();
       for(s2 in 1:length(symbols)){
       	      if(symbols[s2]==symbol){
		seen<-TRUE;    
	      }
       	      # if(!seen){
	      # 	next;	
	      # }
       	      corData<-findCorrelation(symbol,symbols[s2])
	      corResult<-cor(corData$sd1_price,corData$sd2_price)
	      print(sprintf("s1=%s,s2=%s,cor=%s",symbol,symbols[s2],corResult));	      
	      # corMat[symbol,symbols[s2]]<-corResult;
	      # corMat[symbols[s2],symbol]<-corResult;	
	      corResultArray[symbols[s2]]<-corResult;
       }       
       return (corResultArray);
}

parallelPairWiseCorrelation<-function(){    
symbols<-findAllSymbols();
symbols<-symbols$symbol
#symbols<-c('PNB','SBIN','ZYLOG')
#parallelCluster <- parallel::makeCluster(parallel::detectCores())
parallelCluster <- parallel::makeCluster(10)
print(parallelCluster)
clusterExport(parallelCluster,c("symbols","findDataForSymbol","findCorrelation","findAllSymbols","findPairwiseCorrelation","findCorrelationWithAll"),envir=environment())
    parallelWorker<-function(s){
        library(RMySQL)
	#print(s)
	#corData<-list();
	g<- findCorrelationWithAll(s,symbols)
	return (g)
    }   
f<-parallel::parSapply(parallelCluster,symbols,parallelWorker)
# Shutdown cluster neatly
if(!is.null(parallelCluster)) {
  parallel::stopCluster(parallelCluster)
  parallelCluster <- c()
}
return (f)    ;
}

plotSimultaneously<-function (symbol1,symbol2){
pairWiseData<-findPairWiseData(symbol1,symbol2)
ggplot(pairWiseData,aes(date,sd1_price))+geom_line(aes(color=symbol1))+geom_line(data=pairWiseData,aes(date,sd2_price,color=symbol2))+geom_line(data=pairWiseData,aes(date,(sd2_price-sd1_price)/((sd2_price+sd1_price)/2),color='change'))+scale_colour_manual("",breaks = c(symbol1, symbol2,'change'), values = c("red", "brown",'black'))
}

plotSingle<-function (symbol1){
data<-findDataForSymbol(symbol1)
data$date<-as.Date(data$date);
ggplot(data,aes(date,average_price))+geom_line(aes(color=symbol1))+scale_colour_manual("",breaks=c(symbol1),values=c("red"))
}
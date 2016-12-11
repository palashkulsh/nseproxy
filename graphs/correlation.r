library(RMySQL)
library(ggplot2)
library(parallel)
library(gridExtra)
library(gcookbook)
#plotting a single graph


findDataForSymbol<- function(symbol1,afterdate=NULL){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-sprintf("select * from stock_data sd where symbol='%s' and series='EQ'",symbol1)
if(!is.null(afterdate)){
    query<-sprintf("%s and sd.date>'%s' ",query,afterdate);
}		       
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


findPairWiseData<- function(symbol1,symbol2,afterdate=NULL){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-sprintf("select sd1.date,sd1.average_price as sd1_price,sd2.average_price as sd2_price  from stock_data as sd1 inner join stock_data as sd2 on sd1.date=sd2.date where sd1.symbol='%s' and sd2.symbol='%s' and sd1.series='EQ' and sd2.series='EQ'",symbol1,symbol2);
if(!is.null(afterdate)){
    query<-sprintf("%s and sd1.date>'%s' and sd2.date>'%s'",query,afterdate,afterdate);
}		       
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
return( ccf(data$sd1_price,data$sd2_price,plot=FALSE));
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

plotSimultaneously<-function (symbol1,symbol2,afterdate=NULL){
pairWiseData<-findPairWiseData(symbol1,symbol2,afterdate)
ggplot(pairWiseData,aes(date,sd1_price))+geom_line(aes(color=symbol1))+geom_line(data=pairWiseData,aes(date,sd2_price,color=symbol2))+geom_line(data=pairWiseData,aes(date,(sd2_price-sd1_price)/((sd2_price+sd1_price)/2),color='change'))+scale_colour_manual("",breaks = c(symbol1, symbol2,'change'), values = c("red", "brown",'black'))
}

plotSingle<-function (symbol1, afterdate=NULL){
data<-findDataForSymbol(symbol1,afterdate)
data$date<-as.Date(data$date);
p<-ggplot(data,aes(x=date,y=average_price,colour=symbol1))+geom_line()+scale_colour_manual("",breaks=c(symbol1),values=c("red"))
p<-p+ggtitle(symbol1)+theme_bw()
return(p)    
}

plotManySimultaneously <- function (symbols,afterdate=NULL,filename="default.pdf"){
pdf(filename)
for(s in 1:length(symbols)){
      print(plotSingle(symbols[s],afterdate))      
}		       
dev.off()
}

predictiveData <- function (interval=10){
con <- dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="127.0.0.1");
on.exit(dbDisconnect(con));
dbSendQuery(con,'use stocks');
query<-sprintf("select temp.symbol as symbol from (select symbol,avg(100*(close_price-prev_close)/prev_close) as avg_growth,min(100*(close_price-prev_close)/prev_close) as min, max(100*(close_price-prev_close)/prev_close) as max ,avg(close_price) as avgprice from stock_data where date between  date_sub(curdate(),interval %s day ) and  curdate() and average_price>10 group by symbol having max>0 and min > -2.0 and abs(max)>abs(min) order by avg_growth)temp inner join (select symbol,min(close_price) as low52 , max(close_price) as max52 from stock_data where date>date_sub(curdate(),interval 1 year) and date<=curdate() group by symbol ) yearlow on temp.symbol=yearlow.symbol where yearlow.max52-temp.avgprice>2*(temp.avgprice-yearlow.low52) order by avgprice;",interval)
f<-dbSendQuery(con,query);
data<-fetch(f,n=-1);#n=-1 fetches all pending records
return(data$symbol);			  
}

predictivePlot <- function (interval=10,filename='default.pdf',afterdate=NULL){
data<-predictiveData(interval)
plotManySimultaneously(data,filename=filename,afterdate = afterdate)
}

remove_outliers <- function(x, na.rm = TRUE, ...) {
  qnt <- quantile(x, probs=c(.5, .95), na.rm = na.rm, ...)
  H <- 1.5 * IQR(x, na.rm = na.rm)
  y <- x
  y[x < (qnt[1] - H)] <- NA
  y[x > (qnt[2] + H)] <- NA
  y
}
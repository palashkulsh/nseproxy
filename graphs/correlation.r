library(RMySQL)
library(ggplot2)
library(parallel)
library(gridExtra)
library(gcookbook)
#plotting a single graph

singleConnect<-function(){
    return( dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="localhost"));
}

findDataForSymbol<- function(symbol1,afterdate=NULL){
    con <- singleConnect();
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

findPriceAndMovAvgForSymbol <- function (symbol1,afterdate=NULL,duration=50){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select sd.date,sd.close_price,ta_ema(sdmov.close_price,%s) as ema from stock_data sd inner join stock_data as sdmov on sd.date=sdmov.date and sd.symbol=sdmov.symbol and sd.series=sdmov.series where sd.symbol='%s' and sd.series='EQ'",duration,symbol1)
    if(!is.null(afterdate)){
            query<-sprintf("%s and sd.date>'%s' ",query,afterdate);
    }		       
f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    data$date<-as.Date(data$date);	      
    return(data);			    			    
}

#plots the moving avg of diff from average
findDiffFromAvg <- function (symbol1,afterdate=NULL,duration=50){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select date,close_price,ema,ta_sma(diff,50) as diff from (select sd.date,sd.close_price,ta_sma(sdmov.close_price,%s) as ema,sd.close_price-ta_ema(sdmov.close_price,50) as diff from stock_data sd inner join stock_data as sdmov on sd.date=sdmov.date and sd.symbol=sdmov.symbol and sd.series=sdmov.series where sd.symbol='%s' and sd.series='EQ')tbl;",duration,symbol1)
    if(!is.null(afterdate)){
            query<-sprintf("%s and sd.date>'%s' ",query,afterdate);
    }		       
    f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    data$date<-as.Date(data$date);	      
    return(data);			    			    

}

findCorrelation<- function(symbol1,symbol2){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select sd1.date,sd1.average_price as sd1_price,sd2.average_price as sd2_price  from stock_data as sd1 inner join stock_data as sd2 on sd1.date=sd2.date where sd1.symbol='%s' and sd2.symbol='%s' and sd1.series='EQ' and sd2.series='EQ'",symbol1,symbol2);
    print(query);		     
    f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    return( cor(data$sd1_price,data$sd2_price));			    
}


findPairWiseData<- function(symbol1,symbol2,afterdate=NULL){
    con <- singleConnect();
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
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select sd1.date,sd1.average_price as sd1_price,sd2.average_price as sd2_price  from stock_data as sd1 inner join stock_data as sd2 on sd1.date=sd2.date where sd1.symbol='%s' and sd2.symbol='%s' and sd1.series='EQ' and sd2.series='EQ'",symbol1,symbol2);
    print(query);		     
    f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    if(is.null(data) || nrow(data)==0){
	return(NULL);
    }
    return( ccf(data$sd1_price,data$sd2_price,plot=TRUE,lag.max=50));
}

findPairwiseCrossCorrelation<-function(){
    symbols<-findAllSymbols();
    symbols<-symbols$symbol
    #corMat<-data.frame(row.names=symbols)
    for(s1 in 1:length(symbols)){
            for(s2 in s1:length(symbols)){
	    	   if(symbols[s2]<=symbols[s1]){
			next;
		   }
                    corData<-findCrossCorrelation(symbols[s1],symbols[s2]);
		    if(is.null(corData)){
			next;
		    }
		    corData$acf[,1,1]=round(corData$acf[,1,1],digit=2);			
                    str<-sprintf("%s,%s,%s",symbols[s1],symbols[s2],paste(corData$acf[,1,1],collapse=","));
                    #print(str);	      
                    write(str,file="crosscorrelation.csv",append=TRUE)
                    #corMat[symbols[s1],symbols[s2]]<-corData; #corResult;
            }       
}
#return (corMat)    ;
}



findAllSymbols<- function(){
    con <- singleConnect();
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
    #corMat<-data.frame(row.names=symbols)
    for(s1 in 1:length(symbols)){
            for(s2 in s1:length(symbols)){
                    corData<-findCorrelation(symbols[s1],symbols[s2]);
                    str<-sprintf("%s,%s,%s",symbols[s1],symbols[s2],corData);
                    print(str);	      
                    write(str,file="correlation.csv",append=TRUE)
                    #corMat[symbols[s1],symbols[s2]]<-corData; #corResult;
            }       
}
#return (corMat)    ;
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
    clusterExport(parallelCluster,c("symbols","singleConnect","dbConnect","findDataForSymbol","findCorrelation","findAllSymbols","findPairwiseCorrelation","findCorrelationWithAll"),envir=environment())
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

plotPriceAndAvg<-function (symbol1,afterdate=NULL,duration=50){
    pairWiseData<-findPriceAndMovAvgForSymbol(symbol1,afterdate=afterdate,duration=duration)
    pairWiseData<-na.omit(pairWiseData);
    ggplot(pairWiseData,aes(date,close_price))+geom_line(aes(color=symbol1))+geom_line(data=pairWiseData,aes(date,ema,color='ema'))+geom_line(data=pairWiseData,aes(date,(ema-close_price)/((ema+close_price)/2),color='change'))+scale_colour_manual("",breaks = c(symbol1, 'ema','change'), values = c("red", "brown",'black'))
}

plotDiffFromAvg <- function (symbol1,afterdate=NULL,duration=50){
    pairWiseData<- findDiffFromAvg(symbol1,afterdate=afterdate,duration=duration)
    pairWiseData<-na.omit(pairWiseData);				
    p<-ggplot(pairWiseData,aes(x=date,y=diff,colour=symbol1))+geom_line()+scale_colour_manual("",breaks=c(symbol1),values=c("red"))
    p<-p+ggtitle(symbol1)+theme_bw()
    return(p)    

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
    con <- singleConnect();
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


#df is list

remove_outliers_from_list <- function(x,key, na.rm = TRUE, ...) {
    qnt <- quantile(x[[key]], probs=c(.5, .95), na.rm = na.rm, ...)
    H <- 1.5 * IQR(x[[key]], na.rm = na.rm)
    y <- x
    y[, key] <- apply(X[, c(1,3,5)], 2, function(x) ifelse(x < 0.1, 0, x))
    y[key]<-ifelse(y[key]<(qnt[1]-H),NA,y[key]);
    y[key]<-ifelse(y[key]<(qnt[2]+H),NA,y[key]);
    return(y);
}

getVolatility<- function(symbol,duration=5,afterdate=NULL){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select date,ta_stddevp(average_price,%s) as volatility from stock_data sd where symbol='%s' and series='EQ'",duration,symbol)
    if(!is.null(afterdate)){
            query<-sprintf("%s and sd.date>'%s' ",query,afterdate);
    }		       
f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    return(data);			  
}

plotVolatility<- function(symbol,duration=5,afterdate=NULL){
    data<-getVolatility(symbol,duration,afterdate)
    data<-na.omit(data);
    data$date<-as.Date(data$date);
    p<-ggplot(data,aes(x=date,y=volatility,colour=symbol))+geom_line()+scale_colour_manual("",breaks=c(symbol),values=c("red"))
    p<-p+ggtitle(symbol)+theme_bw()
    return(p)    
}
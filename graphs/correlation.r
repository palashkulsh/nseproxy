library(RMySQL)
library(ggplot2)
library(parallel)
library(gridExtra)
library(gcookbook)
#plotting a single graph

singleConnect<-function(){
    return( dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="localhost"));
}


findSymbolForIndustry <- function (industry){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select symbol from symbol_mc_map where industry=%s",industry)
    f<-dbSendQuery(con,query);  
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    na.omit(data);
    return(data);			  			   
}

findStocksBelowBookValue<- function(ondate=format(Sys.time(), "%Y-%m-%d")){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select fin.symbol as symbol,fin.key_text,fin.value as bookvalue,sd.close_price as lastclose from fin inner join stock_data sd on sd.symbol=fin.symbol and sd.date='%s' where replace(replace(key_text,' ',''),'.','')='BookValue[ExclRevalReserve]/Share(Rs)' and year=year(now())-1 and sd.series='eq' and sd.close_price<fin.value ",ondate)
    f<-dbSendQuery(con,query);  
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    na.omit(data);
    return(data);			  			   
}

findDataForSymbolWithBookValue<- function(symbol1,afterdate=NULL){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select * from fin right outer join stock_data sd on sd.symbol=fin.symbol  and year=year(sd.date) where replace(replace(key_text,' ',''),'.','')    ='BookValue[ExclRevalReserve]/Share(Rs)' and sd.series='eq' and fin.symbol='%s' order by date ",symbol1)
    if(!is.null(afterdate)){
            query<-sprintf("%s and sd.date>'%s' ",query,afterdate);
    }		       
f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    return(data);			  
}

findDataForSymbol<- function(symbol1,afterdate=NULL){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select *  from stock_data sd where symbol='%s' and series='EQ' order by date",symbol1)
    if(!is.null(afterdate)){
            query<-sprintf("%s and sd.date>'%s' ",query,afterdate);
    }		       
f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    data$date<-as.Date(data$date);
    na.omit(data);
    return(data);			  
}

findDataForSymbols<- function(symbols,afterdate=NULL){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');   
    query<-sprintf("select *  from stock_data sd where symbol in (%s) and series='EQ'",paste("'",symbols,"'",sep="",collapse=","))
    if(!is.null(afterdate)){
            query<-sprintf("%s and sd.date>'%s' ",query,afterdate);
    }
    query<-paste(query,"order by date");		       
    print(query)
    f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    data$date<-as.Date(data$date);
    na.omit(data);
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
    query<- sprintf("%s order by date",query); #because unordered entries were creating spikes
f<-dbSendQuery(con,query);
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    data$date<-as.Date(data$date);	      
    return(data);			    			    
}

#plots the moving avg of diff from average
findDiffFromAvg <- function (symbols,afterdate=NULL,duration=50,smatime=50){
    if(is.null(afterdate)){
	afterdate<-'2000-01-01';
    }
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select symbol,date,close_price,ema,ta_sma(diff,%s) as diff from (select sd.symbol,sd.date,sd.close_price,ta_sma(sdmov.close_price,%s) as ema,sd.close_price-ta_ema(sdmov.close_price,50) as diff from stock_data sd inner join stock_data as sdmov on sd.date=sdmov.date and sd.symbol=sdmov.symbol and sd.series=sdmov.series where sd.symbol in (%s) and sd.series='EQ' and sd.date>'%s' order by date)tbl ",smatime,duration,paste("'",symbols,"'",sep="",collapse=","),afterdate)
    print(query)
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

plotDiffFromAvg <- function (symbol1,afterdate=NULL,duration=50,smatime=50){
    pairWiseData<- findDiffFromAvg(symbol1,afterdate=afterdate,duration=duration,smatime=smatime)
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

plotSingleWithValue<- function(symbol1,afterdate=NULL){
    data<-findDataForSymbolWithBookValue(symbol1,afterdate)
    if(!length(data$date)){
	return();
    }
    data$date<-as.Date(data$date);
    p<-ggplot(data=data,aes(date,average_price))+geom_line(aes(color=symbol1))+geom_line(data=data,aes(date,value))+geom_line(aes(color='bookvalue'))+scale_colour_manual("",breaks = c(symbol1, 'bookvalue'), values = c("red", "brown"))    		      
    return(p);
}

plotVolumeSingle<-function (symbol1, afterdate=NULL){
    data<-findDataForSymbol(symbol1,afterdate)
    data$date<-as.Date(data$date);
    p<-ggplot(data,aes(x=date,y=percent_dly_qt_to_traded_qty,colour=symbol1))+geom_line()+scale_colour_manual("",breaks=c(symbol1),values=c("red"))
    p<-p+ggtitle(symbol1)+theme_bw()
    return(p)    
}

plotManySimultaneously <- function (symbols,afterdate=NULL,filename="default.pdf",functor=plotSingle){
    pdf(filename)
    for(s in 1:length(symbols)){
    	    print(symbols[s])
            print(functor(symbols[s],afterdate))      
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

plotAllBelowBookValue <-function(){
	plotManySimultaneously(findStocksBelowBookValue()$symbol,functor=plotSingleWithValue);
}

findFinData<- function(symbol){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select distinct f.symbol,f.key_text,f16.value as '2016',f15.value as '2015',f14.value as '2014',f13.value as '2013',f12.value as '2012',f11.value as '2011',f10.value as '2010' , f09.value as '2009',f08.value as '2008',f07.value as '2007',f06.value as '2006',f05.value as '2005',f04.value as '2004' from fin as f left outer join fin as f16 on f.symbol=f16.symbol and f.key_text=f16.key_text and f16.year=2016 left outer join fin as f15 on f.symbol=f15.symbol and f.key_text=f15.key_text and f15.year=2015 left outer join fin as f14 on f.symbol=f14.symbol and f.key_text=f14.key_text and f14.year=2014 left outer join fin as f13 on f.symbol=f13.symbol and f.key_text=f13.key_text and f13.year=2013  left outer join fin as f12 on f.symbol=f12.symbol and f.key_text=f12.key_text and f12.year=2012 left outer join fin as f11 on f.symbol=f11.symbol and f.key_text=f11.key_text and f11.year=2011  left outer join fin as f10 on f.symbol=f10.symbol and f.key_text=f10.key_text and f10.year=2010 left outer join fin as f09 on f.symbol=f09.symbol and f.key_text=f09.key_text and f09.year=2009 left outer join fin as f08 on f.symbol=f08.symbol and f.key_text=f08.key_text and f08.year=2008 left outer join fin as f07 on f.symbol=f07.symbol and f.key_text=f07.key_text and f07.year=2007 left outer join fin as f06 on f.symbol=f06.symbol and f.key_text=f06.key_text and f06.year=2006 left outer join fin as f05 on f.symbol=f05.symbol and f.key_text=f05.key_text and f05.year=2005 left outer join fin as f04 on f.symbol=f04.symbol and f.key_text=f04.key_text and f04.year=2004   where f.symbol='%s';",symbol)
    f<-dbSendQuery(con,query);  
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    na.omit(data);
    return(data);			  			   
}

findRawFinData<- function(symbol){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select symbol month,year,replace(replace(key_text,' ',''),'.','') as key_text,value From fin where symbol='%s';",symbol)
    f<-dbSendQuery(con,query);  
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    na.omit(data);
    return(data);			  			   
}

findAllNearLow<-function(){
    con <- singleConnect();
    on.exit(dbDisconnect(con));
    dbSendQuery(con,'use stocks');
    query<-sprintf("select symbol,52l,52ldt,52h,52hdt,lastprice, recovery from (select symbol,52l,52ldt,52h,52hdt,lastprice,(lastprice-52l)/52l*100 as recovery from (select symbol,min(average_price) as 52l,strvalformin(average_price,date) as 52ldt,max(average_price) as 52h,strvalformax(average_price,date) as 52hdt,realvalfordatemax(year(date),month(date),dayofmonth(date),average_price) as lastprice from stock_data force index( `idx_date`) where date between date_sub(curdate(),interval 1 year) and date_sub(curdate(),interval 0 day) and series='EQ' group by symbol having strvalformin(average_price,date) between date_sub(curdate(),interval 7 day) and date_sub(curdate(),interval 0 day))tbl where (lastprice-52l)/52l*100 between 0 and 10)tb order by recovery;")
    f<-dbSendQuery(con,query);  
    data<-fetch(f,n=-1);#n=-1 fetches all pending records
    na.omit(data);
    return(data);			  			   
}

plotAllNearLow<-function(){
	plotManySimultaneously(findAllNearLow()$symbol,functor=plotSingle,filename='near_low.pdf');
}

plotFinGraph<-function(symbol,afterdate=NULL){
    #provided afterdate for compatibility with plotManySimultaneously
    data<-findRawFinData(symbol);
    na.omit(data)
    p<-ggplot(data,aes(year,value))+geom_point(color='blue')+geom_line(color='black')+facet_wrap(~key_text,scales="free")+labs(title=symbol);
    return(p);
}

plotManyImgSimultaneously <- function (symbols,afterdate=NULL,filename="default.jpg",functor=plotSingle){
    jpeg(filename)
    for(s in 1:length(symbols)){
    	    print(symbols[s])
            print(functor(symbols[s],afterdate))      
    }		       
dev.off()
}

saveFinGraph <- function (symbol,filename='default.jpg'){
	     jpeg(filename);
	     print(plotFinGraph(symbol),width=800);
	     dev.off()
}

plotMany <- function(symbols,afterdate=NULL){
	 data<-findDataForSymbols(symbols,afterdate)
	 p<- ggplot(data,aes(date,average_price))+geom_line()+facet_grid(symbol~.,scales="free_y")
	 return(p)
}

plotManyWrap <- function(symbols,afterdate=NULL){
	 data<-findDataForSymbols(symbols,afterdate)
	 p<- ggplot(data,aes(date,average_price,group=1))+geom_line()+facet_wrap(~symbol,scales="free")+scale_y_continuous(breaks=NULL)+scale_x_date(breaks=NULL)
	 return(p)
}

plotIndustry <- function(industry,afterdate=Sys.Date()-31){
    plotManyWrap(findSymbolForIndustry(industry)$symbol,afterdate=afterdate)    
}

plotMultiDiffFromAvg <-function(symbols,afterdate=Sys.Date()-200){
		     data <- findDiffFromAvg(symbols,afterdate=afterdate);
    pairWiseData<-na.omit(data);				
    p<-ggplot(pairWiseData,aes(x=date,y=diff))+geom_line()+facet_wrap(~symbol,scales="free")+scale_y_continuous(breaks=c(0))+scale_x_date(breaks=NULL)
    return(p)    		     
}

plotIndustryDiffFromAvg <- function (industry,afterdate=Sys.Date()-400){
			plotMultiDiffFromAvg(findSymbolForIndustry(industry)$symbol,afterdate=afterdate)    
}
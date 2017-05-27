library(RMySQL)
library(ggplot2)
library(parallel)
library(gridExtra)
library(gcookbook)
#plotting a single graph

singleConnect<-function(){
    return( dbConnect(MySQL(),user="stocks_user",password="stocks_pass",db_name="stocks",host="localhost"));
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

plotFinData <- function(symbol){
	    data <- findFinData(symbol);    
	    for(i in length(d$key_text)){
	    	  g<- lapply(d, `[[`, i);
		  g<-lapply(g,function(x) na.omit(as.numeric(x)))
		  values<-unlist(tail(g,n=-2))
		  names<-names(tail(g,n=-2))
		  print(values)
		  print(names)
		  plot(g)
		  ggplot(g,aes())+geom_line(aes(color=symbol1))    
		  }
}
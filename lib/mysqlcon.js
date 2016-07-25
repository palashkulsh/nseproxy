var mysql      = require('mysql');
var dbconfig = require('../config/db');
var debug = require('debug')('lib.mysqlcon');
var sql = require('sql');
sql.setDialect('mysql');
var ConnectionPool = mysql.createPool(dbconfig);

/**
   MySQL 5.5 database added.  Please make note of these credentials:

   Root User: adminA3W8twB
   Root Password: eTvkGbKH2G-S
   Database Name: nseproxy

   Connection URL: mysql://$OPENSHIFT_MYSQL_DB_HOST:$OPENSHIFT_MYSQL_DB_PORT/

   You can manage your new MySQL database by also embedding phpmyadmin.
   The phpmyadmin username and password will be the same as the MySQL credentials above.
*/

/** 
    create new connection every and end it after the query
    other wise it may leave opened connections after dbcrawler has stopped
*/
function exec(query,cb){    
    var connection = ConnectionPool.createConnection(dbconfig);
    var queryString;
    if(typeof(query)==='object'){
	queryString=query.toString();
    }else{
	queryString=query;
    }
    debug(queryString)
    connection.query(queryString, function(err, rows, fields) {
	connection.end();
	if (err) { 
	    return cb(err);
	};
	return cb(err,rows);
    });        
}

function poolExec(query,cb){    
    var queryString;
    if(typeof(query)==='object'){
	queryString=query.toString();
    }else{
	queryString=query;
    }
    debug(queryString)
    ConnectionPool.query(queryString, function(err, rows, fields) {
	if (err) { 
	    return cb(err);
	};
	return cb(err,rows);
    });        
}

module.exports={
    exec:poolExec,
    define: sql.define
};

(function(){
    if(require.main===module){
	exec('select * from merchant_payout',function(err,rows,fields){
	    console.log(arguments);
	})
    }
})()

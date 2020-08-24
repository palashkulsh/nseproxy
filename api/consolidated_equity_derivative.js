
var Async = require('async');
var Moment = require('moment');
var Util = require('util');
var request = require('request');
var RateLimiter = require('limiter').RateLimiter;
var Limiter = new RateLimiter(50,'sec'); // limiting to 100 requests per sec
var SqlLimiter = new RateLimiter(20,'sec'); // limiting to 50 requests per sec
var OptionsChainModel = require('../model/options_chain');


function getUniverseData(url, )

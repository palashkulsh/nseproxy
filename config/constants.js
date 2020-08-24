var Symbols = require('./symbols');

var Constants = {
  NSE_TO_SYSTEM_MAP :{
	  'Symbol'	:	'symbol'	,
	  'Series'	:	'series'	,
	  'Date'	:	'date'	,
	  'Prev Close'	:	'prev_close'	,
	  'Open Price'	:	'open_price'	,
	  'High Price'	:	'high_price'	,
	  'Low Price'	:	'low_price'	,
	  'Last Price'	:	'last_price'	,
	  'Close Price'	:	'close_price'	,
	  'Average Price'	:	'average_price'	,
	  'Total Traded Quantity'	:	'total_traded_quantity'	,
	  'Turnover in Lacs'	:	'turnover_in_lacs'	,
	  'No. of Trades'	:	'no_of_trades'	,
	  'Deliverable Qty'	:	'deliverable_qty'	,
	  '% Dly Qt to Traded Qty'	:	'percent_dly_qt_to_traded_qty'	,

  },
  NSE_TO_SYSTEM_TYPE_MAP: {
	  'Symbol'	:	'string'	,
	  'Series'	:	'string'	,
	  'Date'	:	'string'	,
	  'Prev Close'	:	'number'	,
	  'Open Price'	:	'number'	,
	  'High Price'	:	'number'	,
	  'Low Price'	:	'number'	,
	  'Last Price'	:	'number'	,
	  'Close Price'	:	'number'	,
	  'Average Price'	:	'number'	,
	  'Total Traded Quantity'	:	'number'	,
	  'Turnover in Lacs'	:	'number'	,
	  'No. of Trades'	:	'number'	,
	  'Deliverable Qty'	:	'number'	,
	  '% Dly Qt to Traded Qty'	:	'number'	,    
  },
  NSE_TO_SYSTEM_TYPE_MAP_V2:{
    'CH_SYMBOL': 'string',
    'CH_SERIES': 'string',
    'CH_TRADE_HIGH_PRICE': 'number',
    'CH_TRADE_LOW_PRICE': 'number',
    'CH_OPENING_PRICE': 'number',
    'CH_CLOSING_PRICE': 'number',
	  'CH_CLOSING_PRICE'	:	'number'	,
    'CH_LAST_TRADED_PRICE': 'number',
    'CH_PREVIOUS_CLS_PRICE': 'number',
    'CH_TOT_TRADED_QTY': 'number',
    'CH_TOT_TRADED_VAL':'number',
    'CH_TOTAL_TRADES': 'number',
    'CH_TIMESTAMP':'string',
  },

  NSE_TO_SYSTEM_MAP_V2:{
    'CH_SYMBOL': 'symbol',
    'CH_SERIES': 'series',
    'CH_TRADE_HIGH_PRICE': 'high_price',
    'CH_TRADE_LOW_PRICE': 'low_price',
    'CH_OPENING_PRICE': 'open_price',
	  'CH_CLOSING_PRICE'	:	'average_price'	, //latest data source does not have avg price so taking close price as avg
    'CH_CLOSING_PRICE': 'close_price',
    'CH_LAST_TRADED_PRICE': 'last_price',
    'CH_PREVIOUS_CLS_PRICE': 'prev_close',
    'CH_TOT_TRADED_QTY': 'total_traded_quantity',
    'CH_TOTAL_TRADES': 'no_of_trades',
    'CH_TIMESTAMP':'date',
  },
  
  NSE_TO_SYSTEM_HOLDING_MAP:{
	  'Promoter & Promoter Group' : 'promoter',
	  'Public' : 'public',
	  'Shares held by Employee Trusts': 'employee',
	  'Total': 'total'
  },
  symbols: Symbols
};
module.exports = Constants;

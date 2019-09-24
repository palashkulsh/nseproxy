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
  NSE_TO_SYSTEM_HOLDING_MAP:{
	  'Promoter & Promoter Group' : 'promoter',
	  'Public' : 'public',
	  'Shares held by Employee Trusts': 'employee',
	  'Total': 'total'
  },
  symbols: Symbols
};
module.exports = Constants;

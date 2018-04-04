to sync the stock details of from nse data
run api/historical_data.js after changing the from and to time period dates
It runs getAndInsertHistDataForAllStocks and syncs the data for all the stocks

run api/share_holding_pattern.js for populating holdings table which shows the share holding pattern of the stock

things to do
-
add proper doc so that can be used even after 10 years

if getting the error that truncate for column as value is '-' then you need to change sql mode by


flow for symbol_mc_map

--> symbols should be present in config/symbols.js
--> api/historical_data.js picks data of these symbols
--> api/moneycontrol_map.js uses stocks_data symbol to fetch moneycontrol symbols
--> bin/dividends.js picks symbols from symbol_mc_map to pick dividends of latest symbols
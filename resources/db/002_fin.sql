CREATE TABLE `fin` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT,
  `symbol` varchar(20) DEFAULT NULL,
  `month` varchar(10) DEFAULT NULL,
  `year` int(5) DEFAULT NULL,
  `key_text` varchar(300) DEFAULT NULL,
  `key_type` varchar(50) DEFAULT NULL,
  `value` decimal(10,3) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_symbol,year_month_key_text` (`symbol`,`year`,`month`,`key_text`),
  KEY `idx_symbol` (`symbol`),
  KEY `idx_year` (`year`),
  KEY `idx_key_text` (`key_text`),
  KEY `key_type` (`key_type`)
)

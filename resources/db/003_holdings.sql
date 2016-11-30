CREATE TABLE `holdings` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(12) NOT NULL,
  `promoter` decimal(5,2) DEFAULT '0.00',
  `public` decimal(5,2) DEFAULT '0.00',
  `employee` decimal(5,2) DEFAULT '0.00',
  `total` decimal(5,2) DEFAULT '0.00',
  `date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `symbol` (`symbol`,`date`,`promoter`,`public`,`employee`,`total`),
  KEY `idx_symbol` (`symbol`)
)

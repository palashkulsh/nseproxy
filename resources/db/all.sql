-- MySQL dump 10.13  Distrib 5.6.33, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: stocks
-- ------------------------------------------------------
-- Server version	5.6.33-0ubuntu0.14.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bonus`
--

DROP TABLE IF EXISTS `bonus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bonus` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(20) NOT NULL,
  `bonus_share` int(10) NOT NULL,
  `holds_share` int(10) NOT NULL,
  `announcement` date DEFAULT NULL,
  `record` date DEFAULT NULL,
  `ex_bonus` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_symbol_bonus_holds_announcement` (`symbol`,`bonus_share`,`holds_share`,`announcement`),
  KEY `idx_symbol` (`symbol`),
  KEY `idx_announcement` (`announcement`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dividend`
--

DROP TABLE IF EXISTS `dividend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dividend` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(20) NOT NULL,
  `type` varchar(20) NOT NULL,
  `value_pcent` int(10) NOT NULL,
  `announcement` date DEFAULT NULL,
  `record` date DEFAULT NULL,
  `ex_dividend` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_symbol_type_announcement` (`symbol`,`type`,`announcement`),
  KEY `idx_symbol` (`symbol`),
  KEY `idx_type` (`type`),
  KEY `idx_announcement` (`announcement`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fin`
--

DROP TABLE IF EXISTS `fin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fin_old`
--

DROP TABLE IF EXISTS `fin_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fin_old` (
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `holdings`
--

DROP TABLE IF EXISTS `holdings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_data`
--

DROP TABLE IF EXISTS `stock_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_data` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT,
  `symbol` varchar(12) DEFAULT NULL,
  `series` varchar(12) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `prev_close` float DEFAULT NULL,
  `open_price` float DEFAULT NULL,
  `high_price` float DEFAULT NULL,
  `low_price` float DEFAULT NULL,
  `last_price` float DEFAULT NULL,
  `close_price` float DEFAULT NULL,
  `average_price` float DEFAULT NULL,
  `total_traded_quantity` int(12) unsigned DEFAULT NULL,
  `turnover_in_lacs` int(12) unsigned DEFAULT NULL,
  `no_of_trades` int(12) unsigned DEFAULT NULL,
  `deliverable_qty` int(12) unsigned DEFAULT NULL,
  `percent_dly_qt_to_traded_qty` int(12) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_symbol_series_date` (`symbol`,`series`,`date`),
  KEY `idx_symbol` (`symbol`),
  KEY `idx_date` (`date`),
  KEY `idx_open_price` (`open_price`),
  KEY `idx_close_price` (`close_price`),
  KEY `idx_agv` (`average_price`),
  KEY `idx_prev` (`prev_close`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_high_price` (`high_price`),
  KEY `idx_low_price` (`low_price`),
  KEY `idx_last_price` (`last_price`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_txt_data`
--

DROP TABLE IF EXISTS `stock_txt_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_txt_data` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(12) NOT NULL,
  `year` varchar(12) DEFAULT NULL,
  `type` varchar(20) NOT NULL,
  `data` text,
  `score` decimal(10,4) DEFAULT NULL,
  `comparative` decimal(10,4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_symbol_type_year` (`symbol`,`type`,`year`),
  KEY `idx_type` (`type`),
  KEY `idx_symbol` (`symbol`),
  KEY `idx_year` (`year`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `symbol_mc_map`
--

DROP TABLE IF EXISTS `symbol_mc_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `symbol_mc_map` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT,
  `symbol` varchar(12) DEFAULT NULL,
  `mc_symbol` varchar(12) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isin` varchar(20) DEFAULT NULL,
  `bse` varchar(20) DEFAULT NULL,
  `industry` int(10) DEFAULT '-1',
  `name` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_map` (`symbol`,`mc_symbol`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-12-19 21:22:47

-- Table structure for table `dify_apps`
--

DROP TABLE IF EXISTS `dify_apps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dify_apps` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_enabled` int DEFAULT '1',
  `api_base` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enable_answer_form` tinyint(1) NOT NULL DEFAULT '0',
  `answer_form_feedback_text` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enable_update_input_after_starts` tinyint(1) NOT NULL DEFAULT '0',
  `opening_statement_display_mode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enable_annotation` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dify_apps`
--

LOCK TABLES `dify_apps` WRITE;
/*!40000 ALTER TABLE `dify_apps` DISABLE KEYS */;
INSERT INTO `dify_apps` VALUES ('cmm9gaoo2000101nu78lnxx2v','2026-03-02 17:26:29.470','2026-03-02 17:26:29.470','DDL Strategist A','workflow',NULL,NULL,1,'https://api.dify.ai/v1','app-Nl7KXqV994rCBFXDZLCDKNxK',0,NULL,0,'default',0),('cmn024lbg000001mqnwzwa2w7','2026-03-21 08:19:37.321','2026-03-21 08:19:37.321','DDL Strategist','advanced-chat',NULL,NULL,1,'https://api.dify.ai/v1','app-NMT4ERBsbv6OZtshfECHHqOw',0,NULL,0,'default',0),('cmnr8ijye000001p93dnnwsxv','2026-04-09 08:48:13.164','2026-04-09 08:48:13.164','Deadline Strategist Workflow','workflow',NULL,NULL,1,'https://api.dify.ai/v1','app-IYDjp0R2YKi5J7uxe1AiS58U',0,NULL,0,'default',0),('cmnsj5uv8000el0b5bjvtfg5y','2026-04-10 06:34:02.748','2026-04-10 06:34:02.748','Final DDL Strategist Workflow ','workflow',NULL,NULL,1,'https://api.dify.ai/v1','app-VuPNeBUhPHQGETXhN41cCCn7',0,NULL,0,'default',0),('cmnt4g4ig000g01phba8eqe4c','2026-04-10 16:29:53.738','2026-04-10 16:29:53.738','DDL Strategist Workflow ','workflow',NULL,NULL,1,'https://api.dify.ai/v1','app-bCYgAYVqnl1Emf24KATTfALq',0,NULL,0,'default',0),('cmnu53fmf001b01phnx0hnqdb','2026-04-11 09:35:47.411','2026-04-11 09:35:47.411','Deadline Strategist Chatflow','advanced-chat',NULL,NULL,1,'https://api.dify.ai/v1','app-X65f2uTPmprJuCtDUqLISo9p',0,NULL,0,'default',0),('cmnvsgb4e002101phee6yaovt','2026-04-12 13:17:25.448','2026-04-12 13:17:25.448','midterm Chatflow','advanced-chat',NULL,NULL,1,'https://api.dify.ai/v1','app-LRcvR6Z5X5cOD1NbcLH2j0KO',0,NULL,0,'default',0);
/*!40000 ALTER TABLE `dify_apps` ENABLE KEYS */;
UNLOCK TABLES;

--

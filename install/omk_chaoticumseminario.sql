-- phpMyAdmin SQL Dump
-- version 5.2.2deb1+deb13u1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : ven. 20 nov. 2026 à 10:41
-- Version du serveur : 11.8.6-MariaDB-0+deb13u1 from Debian-log
-- Version de PHP : 8.4.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `omk_chaoticumseminario`
--

-- --------------------------------------------------------

--
-- Structure de la table `annotation`
--

CREATE TABLE `annotation` (
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `annotation_value`
--

CREATE TABLE `annotation_value` (
  `id` int(11) NOT NULL,
  `annotation_id` int(11) NOT NULL,
  `field` varchar(190) NOT NULL,
  `ordinal` smallint(6) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `api_key`
--

CREATE TABLE `api_key` (
  `id` varchar(32) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `label` varchar(255) NOT NULL,
  `credential_hash` varchar(60) NOT NULL,
  `last_ip` varbinary(16) DEFAULT NULL COMMENT '(DC2Type:ip_address)',
  `last_accessed` datetime DEFAULT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `api_key`
--

INSERT INTO `api_key` (`id`, `owner_id`, `label`, `credential_hash`, `last_ip`, `last_accessed`, `created`) VALUES
('lUEpgv8pfL18z31fpetGNAxL5A1HKgPT', 3, 'chaoticumseminario', '$2y$12$3/69slMcXXUaPBcu5ZPWMe851jahfwhJY6DUr2BHgne4y/Axio7Bq', 0xac190003, '2026-11-20 09:21:08', '2026-10-04 04:56:33');

-- --------------------------------------------------------

--
-- Structure de la table `asset`
--

CREATE TABLE `asset` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `media_type` varchar(190) NOT NULL,
  `storage_id` varchar(190) NOT NULL,
  `extension` varchar(190) DEFAULT NULL,
  `alt_text` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `custom_vocab`
--

CREATE TABLE `custom_vocab` (
  `id` int(11) NOT NULL,
  `item_set_id` int(11) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `label` varchar(190) NOT NULL,
  `lang` varchar(190) DEFAULT NULL,
  `terms` longtext DEFAULT NULL COMMENT '(DC2Type:json)',
  `uris` longtext DEFAULT NULL COMMENT '(DC2Type:json)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `custom_vocab`
--

INSERT INTO `custom_vocab` (`id`, `item_set_id`, `owner_id`, `label`, `lang`, `terms`, `uris`) VALUES
(1, NULL, NULL, 'Annotation Motivation', NULL, '[\"assessing\",\"bookmarking\",\"classifying\",\"commenting\",\"describing\",\"editing\",\"highlighting\",\"identifying\",\"linking\",\"moderating\",\"questioning\",\"replying\",\"tagging\"]', NULL),
(2, NULL, NULL, 'Annotation Target dcterms:format', NULL, '[\"application\\/geo+json\",\"application\\/json\",\"application\\/xml\",\"image\\/svg+xml\",\"application\\/wkt\"]', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `fulltext_search`
--

CREATE TABLE `fulltext_search` (
  `id` int(11) NOT NULL,
  `resource` varchar(190) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL,
  `title` longtext DEFAULT NULL,
  `text` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `fulltext_search`
--

INSERT INTO `fulltext_search` (`id`, `resource`, `owner_id`, `is_public`, `title`, `text`) VALUES
(1998, 'items', 3, 1, 'Activités de recherche', 'Activités de recherche\nM9JEPJMI\nCollection Zotero\nhttps://www.zotero.org/users/13594/collections/M9JEPJMI Collection Zotero Activités de recherche'),
(2013, 'items', 3, 1, 'Configuration chaoticum-seminario – 2026-10-14T13:52:47.747Z', 'Configuration chaoticum-seminario – 2026-10-14T13:52:47.747Z\n{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"Usages des intelligences artificielles pour le développement des intelligences collectives\",\n  \"description\": \"Réservée aux élèves du secondaire\\nPour explorer comment les IA transforment\\nnos façons de collaborer, de partager\\nles connaissances et de construire ensemble\\nde nouvelles intelligences collectives.\\nIntervenant : Samuel SZONIECKY\",\n  \"programUrl\": \"https://www.univ-paris8.fr/IMG/pdf/programme-fete-de-la-science-2026.pdf\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\",\n    \"contribution\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"5e2ad041157c\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"/Users/samszo/Sites/ConfErrance/docs\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"5e2ad041157c\"\n  },\n  \"runId\": \"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\n  \"startedAt\": \"2026-10-14T13:52:47.747Z\"\n}\nConfiguration de workflow\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\n2026-10-14T13:52:47.747Z\nsuccess\n2026-10-14T13:52:47.747Z\n2026-10-14T13:53:51.203Z\n{\"tokens\":{\"calls\":19,\"input\":14556,\"output\":3315,\"total\":17871},\"impact\":{\"energyWh\":0.21521457142857142,\"co2g\":0.006886866285714286,\"electricityCost\":0.00004304291428571429,\"apiCost\":0.00414916,\"currency\":\"€\"}}\nPartition chaoticumSeminario (données) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/partition.json\napplication/json\nRapport de la partition – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/rapport_chaoticum.md\ntext/markdown\nDiapo AAQ_2021 27 (écran 2) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_02.png\nimage/png\nDiapo tdcw25 12 (écran 7) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_07.png\nimage/png\nDiapo ValPedArNum 13 (écran 12) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_12.png\nimage/png\nDiapo HDR 22 (écran 17) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_17.png\nimage/png\nDiapo ia-iv-humain-2026 2 (écran 22) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_22.png\nimage/png\nDiapo repyramidage 4 (écran 27) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_27.png\nimage/png'),
(2014, 'media', 3, 1, 'Partition chaoticumSeminario (données) – 2026-10-14T13:53:51.864Z', 'Partition chaoticumSeminario (données) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/partition.json\napplication/json'),
(2015, 'media', 3, 1, 'Rapport de la partition – 2026-10-14T13:53:51.864Z', 'Rapport de la partition – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/rapport_chaoticum.md\ntext/markdown'),
(2016, 'media', 3, 1, 'Diapo AAQ_2021 27 (écran 2) – 2026-10-14T13:53:51.864Z', 'Diapo AAQ_2021 27 (écran 2) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_02.png\nimage/png'),
(2017, 'media', 3, 1, 'Diapo tdcw25 12 (écran 7) – 2026-10-14T13:53:51.864Z', 'Diapo tdcw25 12 (écran 7) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_07.png\nimage/png'),
(2018, 'media', 3, 1, 'Diapo ValPedArNum 13 (écran 12) – 2026-10-14T13:53:51.864Z', 'Diapo ValPedArNum 13 (écran 12) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_12.png\nimage/png'),
(2019, 'media', 3, 1, 'Diapo HDR 22 (écran 17) – 2026-10-14T13:53:51.864Z', 'Diapo HDR 22 (écran 17) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_17.png\nimage/png'),
(2020, 'media', 3, 1, 'Diapo ia-iv-humain-2026 2 (écran 22) – 2026-10-14T13:53:51.864Z', 'Diapo ia-iv-humain-2026 2 (écran 22) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_22.png\nimage/png'),
(2021, 'media', 3, 1, 'Diapo repyramidage 4 (écran 27) – 2026-10-14T13:53:51.864Z', 'Diapo repyramidage 4 (écran 27) – 2026-10-14T13:53:51.864Z\n2026-10-14T13:53:51.864Z\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_27.png\nimage/png'),
(2022, 'items', 3, 1, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 14/10/2026 15:55:28', 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 14/10/2026 15:55:28\nParticipation chaoticumSeminario\n2026-10-14T13-57-46-873Z-5c18c3\n2026-10-14T13:55:28.084Z\nSéance du 14/10/2026 15:55:28 (en direct) : 28 passage(s) d\'écran, 2 min, 0 contribution(s), 0 écran(s) très dépassé(s).\nConfiguration chaoticum-seminario – 2026-10-14T13:52:47.747Z\n{\"runId\":\"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\"mode\":\"live\",\"elapsedSeconds\":138,\"events\":28,\"contributions\":0,\"share\":\"b374ed9d55d0ac2ba3d34794afea19cb\"}\nParticipation 2026-10-14T13-57-46-873Z-5c18c3\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-14T13-57-46-873Z-5c18c3.json\napplication/json'),
(2023, 'media', 3, 1, 'Participation 2026-10-14T13-57-46-873Z-5c18c3', 'Participation 2026-10-14T13-57-46-873Z-5c18c3\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-14T13-57-46-873Z-5c18c3.json\napplication/json'),
(2024, 'items', 3, 1, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:19:53', 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:19:53\nParticipation chaoticumSeminario\n2026-10-17T06-22-33-415Z-8523f5\n2026-10-17T06:19:53.350Z\nSéance du 17/10/2026 08:19:53 (en direct) : 2 passage(s) d\'écran, 3 min, 0 contribution(s), 2 écran(s) très dépassé(s), 4 annotation(s) du public.\nConfiguration chaoticum-seminario – 2026-10-14T13:52:47.747Z\n{\"runId\":\"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\"mode\":\"live\",\"elapsedSeconds\":160,\"events\":2,\"contributions\":0,\"share\":\"bab394878d2a784250bf442c462766c4\"}\nParticipation 2026-10-17T06-22-33-415Z-8523f5\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-17T06-22-33-415Z-8523f5.json\napplication/json'),
(2025, 'media', 3, 1, 'Participation 2026-10-17T06-22-33-415Z-8523f5', 'Participation 2026-10-17T06-22-33-415Z-8523f5\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-17T06-22-33-415Z-8523f5.json\napplication/json'),
(2026, 'items', 3, 1, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:24:07', 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:24:07\nParticipation chaoticumSeminario\n2026-10-17T06-27-26-080Z-65af31\n2026-10-17T06:24:07.346Z\nSéance du 17/10/2026 08:24:07 (en direct) : 3 passage(s) d\'écran, 3 min, 0 contribution(s), 1 écran(s) très dépassé(s).\nConfiguration chaoticum-seminario – 2026-10-14T13:52:47.747Z\n{\"runId\":\"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\"mode\":\"live\",\"elapsedSeconds\":199,\"events\":3,\"contributions\":0,\"share\":\"99748dab4311be081b395e606b0a460e\"}\nParticipation 2026-10-17T06-27-26-080Z-65af31\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-17T06-27-26-080Z-65af31.json\napplication/json'),
(2027, 'media', 3, 1, 'Participation 2026-10-17T06-27-26-080Z-65af31', 'Participation 2026-10-17T06-27-26-080Z-65af31\na014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-17T06-27-26-080Z-65af31.json\napplication/json'),
(2028, 'items', 3, 1, 'Configuration chaoticum-seminario – 2026-10-24T05:14:17.337Z', 'Configuration chaoticum-seminario – 2026-10-24T05:14:17.337Z\n{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"Jean-Pierre Balpe, (méta-)auteur : l’écriture infinie  \",\n  \"description\": \"Jean-Pierre Balpe, un des premiers auteurs et théoriciens en France à s’intéresser au potentiel créatif littéraire de l’informatique mais demeurant très peu connu du grand public, travaille depuis presqu’un demi-siècle à la génération automatique de textes comme un mode de création littéraire qui interroge nos présupposés au sujet du langage, de l’écriture et de la littérature. Au cours des années, il a suivi de près l’évolution des outils et des environnements numériques, développant des générateurs de plus en plus performants d’une part, et investissant d’autre part les réseaux sociaux numériques pour non seulement publier une partie des textes poétiques et narratifs automatiquement générés, mais pour les attribuer à des êtres fictionnels, des « profils » pseudo- ou hétéronymes. La dernière version de son logiciel de génération de textes, une intelligence artificielle symbolique qui est à notre connaissance unique au monde dans son genre par son ampleur et son raffinement, est basée sur une théorie du sens, du langage et de leur rapport au monde, développée par Balpe à partir des questions soulevées par ses efforts de modélisation de l’écriture littéraire générative (Balpe 2000, 2021). Elle inclut des millions de données linguistiques accumulées depuis les années 1990, ainsi qu’une grammaire définie manuellement et perfectionnée au fur et à mesure des expérimentations.\",\n  \"programUrl\": \"https://balpe2025.sciencesconf.org/\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"4f0e52bb9bf4\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"/Users/samszo/Sites/ConfErrance/docs\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"4f0e52bb9bf4\"\n  },\n  \"runId\": \"ae2d2164-4a68-4318-a820-4ee7b9f546ac\",\n  \"startedAt\": \"2026-10-24T05:14:17.337Z\"\n}\nConfiguration de workflow\nae2d2164-4a68-4318-a820-4ee7b9f546ac\n2026-10-24T05:14:17.337Z\nsuccess\n2026-10-24T05:14:17.337Z\n2026-10-24T05:15:10.675Z\n{\"tokens\":{\"calls\":33,\"input\":35073,\"output\":4164,\"total\":39237},\"impact\":{\"energyWh\":0.4727282142857143,\"co2g\":0.015127302857142859,\"electricityCost\":0.00009454564285714287,\"apiCost\":0.0077110500000000005,\"currency\":\"€\"}}\nPartition chaoticumSeminario (données) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/partition.json\napplication/json\nRapport de la partition – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/rapport_chaoticum.md\ntext/markdown\nDiapo seminaireEHESS_2015 9 (écran 2) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_02.png\nimage/png\nDiapo software_digital-humanitiesII 14 (écran 6) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_06.png\nimage/png\nDiapo iskoMagreb_2015 18 (écran 10) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_10.png\nimage/png\nDiapo seminaireEHESS_2015 11 (écran 14) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_14.png\nimage/png\nDiapo je-creationParis8 26 (écran 18) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_18.png\nimage/png\nDiapo seminaireEHESS_2015 22 (écran 22) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_22.png\nimage/png\nDiapo patrimoine 7 (écran 26) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_26.png\nimage/png\nDiapo seminaireEHESS_2015 7 (écran 30) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_30.png\nimage/png'),
(2029, 'media', 3, 1, 'Partition chaoticumSeminario (données) – 2026-10-24T05:15:11.300Z', 'Partition chaoticumSeminario (données) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/partition.json\napplication/json'),
(2030, 'media', 3, 1, 'Rapport de la partition – 2026-10-24T05:15:11.300Z', 'Rapport de la partition – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/rapport_chaoticum.md\ntext/markdown'),
(2031, 'media', 3, 1, 'Diapo seminaireEHESS_2015 9 (écran 2) – 2026-10-24T05:15:11.300Z', 'Diapo seminaireEHESS_2015 9 (écran 2) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_02.png\nimage/png'),
(2032, 'media', 3, 1, 'Diapo software_digital-humanitiesII 14 (écran 6) – 2026-10-24T05:15:11.300Z', 'Diapo software_digital-humanitiesII 14 (écran 6) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_06.png\nimage/png'),
(2033, 'media', 3, 1, 'Diapo iskoMagreb_2015 18 (écran 10) – 2026-10-24T05:15:11.300Z', 'Diapo iskoMagreb_2015 18 (écran 10) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_10.png\nimage/png'),
(2034, 'media', 3, 1, 'Diapo seminaireEHESS_2015 11 (écran 14) – 2026-10-24T05:15:11.300Z', 'Diapo seminaireEHESS_2015 11 (écran 14) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_14.png\nimage/png'),
(2035, 'media', 3, 1, 'Diapo je-creationParis8 26 (écran 18) – 2026-10-24T05:15:11.300Z', 'Diapo je-creationParis8 26 (écran 18) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_18.png\nimage/png'),
(2036, 'media', 3, 1, 'Diapo seminaireEHESS_2015 22 (écran 22) – 2026-10-24T05:15:11.300Z', 'Diapo seminaireEHESS_2015 22 (écran 22) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_22.png\nimage/png'),
(2037, 'media', 3, 1, 'Diapo patrimoine 7 (écran 26) – 2026-10-24T05:15:11.300Z', 'Diapo patrimoine 7 (écran 26) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_26.png\nimage/png'),
(2038, 'media', 3, 1, 'Diapo seminaireEHESS_2015 7 (écran 30) – 2026-10-24T05:15:11.300Z', 'Diapo seminaireEHESS_2015 7 (écran 30) – 2026-10-24T05:15:11.300Z\n2026-10-24T05:15:11.300Z\nae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_30.png\nimage/png'),
(2039, 'items', 3, 1, 'Participation – Jean-Pierre Balpe, (méta-)auteur : l’écriture infinie   – 24/10/2026 07:16:19', 'Participation – Jean-Pierre Balpe, (méta-)auteur : l’écriture infinie   – 24/10/2026 07:16:19\nParticipation chaoticumSeminario\n2026-10-24T05-28-06-155Z-4fc2e2\n2026-10-24T05:16:19.726Z\nSéance du 24/10/2026 07:16:19 (en direct) : 30 passage(s) d\'écran, 12 min, 0 contribution(s), 1 écran(s) très dépassé(s).\nConfiguration chaoticum-seminario – 2026-10-24T05:14:17.337Z\n{\"runId\":\"ae2d2164-4a68-4318-a820-4ee7b9f546ac\",\"mode\":\"live\",\"elapsedSeconds\":706,\"events\":30,\"contributions\":0,\"share\":\"31a9fabf0e59d9ba78d83bd05e2f5438\"}\nParticipation 2026-10-24T05-28-06-155Z-4fc2e2\nae2d2164-4a68-4318-a820-4ee7b9f546ac/participation_2026-10-24T05-28-06-155Z-4fc2e2.json\napplication/json'),
(2040, 'media', 3, 1, 'Participation 2026-10-24T05-28-06-155Z-4fc2e2', 'Participation 2026-10-24T05-28-06-155Z-4fc2e2\nae2d2164-4a68-4318-a820-4ee7b9f546ac/participation_2026-10-24T05-28-06-155Z-4fc2e2.json\napplication/json'),
(2041, 'items', 3, 1, 'Configuration chaoticum-seminario – 2026-10-27T14:24:20.868Z', 'Configuration chaoticum-seminario – 2026-10-27T14:24:20.868Z\n{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"01D.13 : Design de l\'Intelligence | 13e Colloque International sur les sciences et technologies de la conception\",\n  \"description\": \"\",\n  \"programUrl\": \"https://01design13.sciencesconf.org/resource/page/id/1\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"611ff5e08bc8\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"611ff5e08bc8\"\n  },\n  \"runId\": \"073225ae-3292-426e-a84a-02469d5764d1\",\n  \"startedAt\": \"2026-10-27T14:24:20.868Z\"\n}\nConfiguration de workflow\n073225ae-3292-426e-a84a-02469d5764d1\n2026-10-27T14:24:20.868Z\nsuccess\n2026-10-27T14:24:20.868Z\n2026-10-27T14:26:37.610Z\n{\"tokens\":{\"calls\":34,\"input\":32378,\"output\":4662,\"total\":37040},\"impact\":{\"energyWh\":0.44574819047619046,\"co2g\":0.014263942095238095,\"electricityCost\":0.0000891496380952381,\"apiCost\":0.007552120000000002,\"currency\":\"€\"}}\nPartition chaoticumSeminario (données) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/partition.json\napplication/json\nRapport de la partition – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/rapport_chaoticum.md\ntext/markdown\nDiapo ValPedArNum 15 (écran 2) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_02.png\nimage/png\nDiapo iotLabs_2018 2 (écran 6) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_06.png\nimage/png\nDiapo ia-iv-humain-2026 2 (écran 10) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_10.png\nimage/png\nDiapo 01Design8 19 (écran 14) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_14.png\nimage/png\nDiapo NDIDO2017 17 (écran 18) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_18.png\nimage/png\nDiapo PEPE_2019 14 (écran 22) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_22.png\nimage/png\nDiapo seminaireEHESS_2015 25 (écran 26) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_26.png\nimage/png\nDiapo sqet_2019 21 (écran 30) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_30.png\nimage/png'),
(2042, 'media', 3, 1, 'Partition chaoticumSeminario (données) – 2026-10-27T14:26:38.245Z', 'Partition chaoticumSeminario (données) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/partition.json\napplication/json'),
(2043, 'media', 3, 1, 'Rapport de la partition – 2026-10-27T14:26:38.245Z', 'Rapport de la partition – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/rapport_chaoticum.md\ntext/markdown'),
(2044, 'media', 3, 1, 'Diapo ValPedArNum 15 (écran 2) – 2026-10-27T14:26:38.245Z', 'Diapo ValPedArNum 15 (écran 2) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_02.png\nimage/png'),
(2045, 'media', 3, 1, 'Diapo iotLabs_2018 2 (écran 6) – 2026-10-27T14:26:38.245Z', 'Diapo iotLabs_2018 2 (écran 6) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_06.png\nimage/png'),
(2046, 'media', 3, 1, 'Diapo ia-iv-humain-2026 2 (écran 10) – 2026-10-27T14:26:38.245Z', 'Diapo ia-iv-humain-2026 2 (écran 10) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_10.png\nimage/png'),
(2047, 'media', 3, 1, 'Diapo 01Design8 19 (écran 14) – 2026-10-27T14:26:38.245Z', 'Diapo 01Design8 19 (écran 14) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_14.png\nimage/png'),
(2048, 'media', 3, 1, 'Diapo NDIDO2017 17 (écran 18) – 2026-10-27T14:26:38.245Z', 'Diapo NDIDO2017 17 (écran 18) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_18.png\nimage/png'),
(2049, 'media', 3, 1, 'Diapo PEPE_2019 14 (écran 22) – 2026-10-27T14:26:38.245Z', 'Diapo PEPE_2019 14 (écran 22) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_22.png\nimage/png'),
(2050, 'media', 3, 1, 'Diapo seminaireEHESS_2015 25 (écran 26) – 2026-10-27T14:26:38.245Z', 'Diapo seminaireEHESS_2015 25 (écran 26) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_26.png\nimage/png'),
(2051, 'media', 3, 1, 'Diapo sqet_2019 21 (écran 30) – 2026-10-27T14:26:38.245Z', 'Diapo sqet_2019 21 (écran 30) – 2026-10-27T14:26:38.245Z\n2026-10-27T14:26:38.245Z\n073225ae-3292-426e-a84a-02469d5764d1/diapo_30.png\nimage/png'),
(2052, 'items', 3, 1, 'Configuration chaoticum-seminario – 2026-11-02T15:38:20.002Z', 'Configuration chaoticum-seminario – 2026-11-02T15:38:20.002Z\n{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"01D.13 : Design de l\'Intelligence | 13e Colloque International sur les sciences et technologies de la conception\",\n  \"description\": \"\",\n  \"programUrl\": \"https://01design13.sciencesconf.org/resource/page/id/1\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\",\n    \"contribution\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"11b63a1622c7\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"11b63a1622c7\"\n  },\n  \"runId\": \"121db903-b30c-4297-8900-65c8f01dce89\",\n  \"startedAt\": \"2026-11-02T15:38:20.002Z\"\n}\nConfiguration de workflow\n121db903-b30c-4297-8900-65c8f01dce89\n2026-11-02T15:38:20.002Z\nsuccess\n2026-11-02T15:38:20.002Z\n2026-11-02T15:39:38.279Z\n{\"tokens\":{\"calls\":25,\"input\":23118,\"output\":3427,\"total\":26545},\"impact\":{\"energyWh\":0.3191935,\"co2g\":0.010214192,\"electricityCost\":0.0000638387,\"apiCost\":0.00548316,\"currency\":\"€\"}}\nPartition chaoticumSeminario (données) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/partition.json\napplication/json\nRapport de la partition – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/rapport_chaoticum.md\ntext/markdown\nDiapo ValPedArNum 15 (écran 2) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_02.png\nimage/png\nDiapo HumanAtHome 3 (écran 7) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_07.png\nimage/png\nDiapo software_digital-humanitiesII 16 (écran 12) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_12.png\nimage/png\nDiapo hyperurbain5 7 (écran 17) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_17.png\nimage/png\nDiapo software_digital-humanitiesII 25 (écran 22) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_22.png\nimage/png\nDiapo sqet_2019 17 (écran 27) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_27.png\nimage/png'),
(2053, 'media', 3, 1, 'Partition chaoticumSeminario (données) – 2026-11-02T15:39:38.915Z', 'Partition chaoticumSeminario (données) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/partition.json\napplication/json'),
(2054, 'media', 3, 1, 'Rapport de la partition – 2026-11-02T15:39:38.915Z', 'Rapport de la partition – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/rapport_chaoticum.md\ntext/markdown'),
(2055, 'media', 3, 1, 'Diapo ValPedArNum 15 (écran 2) – 2026-11-02T15:39:38.915Z', 'Diapo ValPedArNum 15 (écran 2) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_02.png\nimage/png'),
(2056, 'media', 3, 1, 'Diapo HumanAtHome 3 (écran 7) – 2026-11-02T15:39:38.915Z', 'Diapo HumanAtHome 3 (écran 7) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_07.png\nimage/png'),
(2057, 'media', 3, 1, 'Diapo software_digital-humanitiesII 16 (écran 12) – 2026-11-02T15:39:38.915Z', 'Diapo software_digital-humanitiesII 16 (écran 12) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_12.png\nimage/png'),
(2058, 'media', 3, 1, 'Diapo hyperurbain5 7 (écran 17) – 2026-11-02T15:39:38.915Z', 'Diapo hyperurbain5 7 (écran 17) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_17.png\nimage/png'),
(2059, 'media', 3, 1, 'Diapo software_digital-humanitiesII 25 (écran 22) – 2026-11-02T15:39:38.915Z', 'Diapo software_digital-humanitiesII 25 (écran 22) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_22.png\nimage/png'),
(2060, 'media', 3, 1, 'Diapo sqet_2019 17 (écran 27) – 2026-11-02T15:39:38.915Z', 'Diapo sqet_2019 17 (écran 27) – 2026-11-02T15:39:38.915Z\n2026-11-02T15:39:38.915Z\n121db903-b30c-4297-8900-65c8f01dce89/diapo_27.png\nimage/png'),
(2061, 'items', 3, 1, 'Configuration chaoticum-seminario – 2026-11-20T05:52:09.552Z', 'Configuration chaoticum-seminario – 2026-11-20T05:52:09.552Z\n{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"Université Paris 8 Formation IA 2026 - 2027\",\n  \"description\": \"Séance 4 : Atelier pratique d’analyse critique des productions et des usages de l’IA\\nA destination des personnels de l\'université Paris 8 : enseignants chercheurs, administratifs, directions, techniciens.\\nCette conférence a pour objectif de montrer les pratiques et les méthodes pour définir les frontières des productions et des usages de l’IA par une analyse critique dans les 3 écologies : environnement (la biosphère extérieure), rapports sociaux (les relations économiques, urbaines et politiques), subjectivité humaine\",\n  \"programUrl\": \"\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 60,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\",\n    \"contribution\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"bdc3520f7a28\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/mb9TqzGM4Y83V6GmpLMBGF/8\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=FormationIA_23112026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"bdc3520f7a28\"\n  },\n  \"runId\": \"e9d8a1c7-048f-4720-810e-ad556a86c01a\",\n  \"startedAt\": \"2026-11-20T05:52:09.552Z\"\n}\nConfiguration de workflow\ne9d8a1c7-048f-4720-810e-ad556a86c01a\n2026-11-20T05:52:09.552Z\nsuccess\n2026-11-20T05:52:09.552Z\n2026-11-20T05:54:53.009Z\n{\"tokens\":{\"calls\":25,\"input\":19623,\"output\":6804,\"total\":26427},\"impact\":{\"energyWh\":0.3174047142857143,\"co2g\":0.010156950857142858,\"electricityCost\":0.00006348094285714286,\"apiCost\":0.006980489999999999,\"currency\":\"€\"}}\nRapport de la partition – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/rapport_chaoticum.md\ntext/markdown\nDiapo je-creationParis8 1 (écran 2) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_02.png\nimage/png\nDiapo software_digital-humanitiesII 3 (écran 7) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_07.png\nimage/png\nDiapo je-creationParis8 8 (écran 12) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_12.png\nimage/png\nDiapo MIND_2020 1 (écran 17) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_17.png\nimage/png\nDiapo software_digital-humanitiesII 32 (écran 22) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_22.png\nimage/png\nDiapo repyramidage 9 (écran 27) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_27.png\nimage/png\nCopie d\'écran diapo_emwol28ka.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwol28ka.png\nCopie d\'écran diapo_emwol8o9k.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwol8o9k.png\nCopie d\'écran diapo_emwolev3w.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolev3w.png\nCopie d\'écran diapo_emwolprtx.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolprtx.png\nCopie d\'écran diapo_emwolrudh.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolrudh.png\nCopie d\'écran diapo_emwolxnsc.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolxnsc.png\nCopie d\'écran diapo_emwomy1e2.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwomy1e2.png\nPartition chaoticumSeminario (données) – modifiée le 2026-11-20T09:13:07.120Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/partition.json\n2026-11-20T09:13:07.120Z\napplication/json'),
(2063, 'media', 3, 1, 'Rapport de la partition – 2026-11-20T05:54:53.641Z', 'Rapport de la partition – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/rapport_chaoticum.md\ntext/markdown'),
(2064, 'media', 3, 1, 'Diapo je-creationParis8 1 (écran 2) – 2026-11-20T05:54:53.641Z', 'Diapo je-creationParis8 1 (écran 2) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_02.png\nimage/png'),
(2065, 'media', 3, 1, 'Diapo software_digital-humanitiesII 3 (écran 7) – 2026-11-20T05:54:53.641Z', 'Diapo software_digital-humanitiesII 3 (écran 7) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_07.png\nimage/png'),
(2066, 'media', 3, 1, 'Diapo je-creationParis8 8 (écran 12) – 2026-11-20T05:54:53.641Z', 'Diapo je-creationParis8 8 (écran 12) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_12.png\nimage/png'),
(2067, 'media', 3, 1, 'Diapo MIND_2020 1 (écran 17) – 2026-11-20T05:54:53.641Z', 'Diapo MIND_2020 1 (écran 17) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_17.png\nimage/png'),
(2068, 'media', 3, 1, 'Diapo software_digital-humanitiesII 32 (écran 22) – 2026-11-20T05:54:53.641Z', 'Diapo software_digital-humanitiesII 32 (écran 22) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_22.png\nimage/png'),
(2069, 'media', 3, 1, 'Diapo repyramidage 9 (écran 27) – 2026-11-20T05:54:53.641Z', 'Diapo repyramidage 9 (écran 27) – 2026-11-20T05:54:53.641Z\n2026-11-20T05:54:53.641Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_27.png\nimage/png'),
(2072, 'media', 3, 1, 'Copie d\'écran diapo_emwol28ka.png (éditeur)', 'Copie d\'écran diapo_emwol28ka.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwol28ka.png'),
(2075, 'media', 3, 1, 'Copie d\'écran diapo_emwol8o9k.png (éditeur)', 'Copie d\'écran diapo_emwol8o9k.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwol8o9k.png'),
(2078, 'media', 3, 1, 'Copie d\'écran diapo_emwolev3w.png (éditeur)', 'Copie d\'écran diapo_emwolev3w.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolev3w.png'),
(2082, 'media', 3, 1, 'Copie d\'écran diapo_emwolprtx.png (éditeur)', 'Copie d\'écran diapo_emwolprtx.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolprtx.png'),
(2085, 'media', 3, 1, 'Copie d\'écran diapo_emwolrudh.png (éditeur)', 'Copie d\'écran diapo_emwolrudh.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolrudh.png'),
(2087, 'media', 3, 1, 'Copie d\'écran diapo_emwolxnsc.png (éditeur)', 'Copie d\'écran diapo_emwolxnsc.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolxnsc.png'),
(2092, 'media', 3, 1, 'Copie d\'écran diapo_emwomy1e2.png (éditeur)', 'Copie d\'écran diapo_emwomy1e2.png (éditeur)\ne9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwomy1e2.png'),
(2121, 'media', 3, 1, 'Partition chaoticumSeminario (données) – modifiée le 2026-11-20T09:13:07.120Z', 'Partition chaoticumSeminario (données) – modifiée le 2026-11-20T09:13:07.120Z\ne9d8a1c7-048f-4720-810e-ad556a86c01a/partition.json\n2026-11-20T09:13:07.120Z\napplication/json');
INSERT INTO `fulltext_search` (`id`, `resource`, `owner_id`, `is_public`, `title`, `text`) VALUES
(2122, 'items', 3, 1, 'Participation – Université Paris 8 Formation IA 2026 - 2027 – 20/11/2026 06:58:25', 'Participation – Université Paris 8 Formation IA 2026 - 2027 – 20/11/2026 06:58:25\nParticipation chaoticumSeminario\n2026-11-20T09-19-19-804Z-52aa24\n2026-11-20T05:58:25.319Z\nSéance du 20/11/2026 06:58:25 (en direct) : 69 passage(s) d\'écran, 201 min, 1 contribution(s), 4 écran(s) très dépassé(s).\nConfiguration chaoticum-seminario – 2026-11-20T05:52:09.552Z\n{\"runId\":\"e9d8a1c7-048f-4720-810e-ad556a86c01a\",\"mode\":\"live\",\"elapsedSeconds\":12054,\"events\":69,\"contributions\":1,\"share\":\"124039ca87ff95817796739be9cf5b73\"}\nParticipation 2026-11-20T09-19-19-804Z-52aa24\ne9d8a1c7-048f-4720-810e-ad556a86c01a/participation_2026-11-20T09-19-19-804Z-52aa24.json\napplication/json'),
(2123, 'media', 3, 1, 'Participation 2026-11-20T09-19-19-804Z-52aa24', 'Participation 2026-11-20T09-19-19-804Z-52aa24\ne9d8a1c7-048f-4720-810e-ad556a86c01a/participation_2026-11-20T09-19-19-804Z-52aa24.json\napplication/json');

-- --------------------------------------------------------

--
-- Structure de la table `item`
--

CREATE TABLE `item` (
  `id` int(11) NOT NULL,
  `primary_media_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `item`
--

INSERT INTO `item` (`id`, `primary_media_id`) VALUES
(1998, NULL),
(2013, NULL),
(2022, NULL),
(2024, NULL),
(2026, NULL),
(2028, NULL),
(2039, NULL),
(2041, NULL),
(2052, NULL),
(2061, NULL),
(2122, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `item_item_set`
--

CREATE TABLE `item_item_set` (
  `item_id` int(11) NOT NULL,
  `item_set_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `item_set`
--

CREATE TABLE `item_set` (
  `id` int(11) NOT NULL,
  `is_open` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `item_site`
--

CREATE TABLE `item_site` (
  `item_id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `job`
--

CREATE TABLE `job` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `pid` varchar(190) DEFAULT NULL,
  `status` varchar(190) DEFAULT NULL,
  `class` varchar(190) NOT NULL,
  `args` longtext DEFAULT NULL COMMENT '(DC2Type:json_array)',
  `log` longtext DEFAULT NULL,
  `started` datetime NOT NULL,
  `ended` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `job`
--

INSERT INTO `job` (`id`, `owner_id`, `pid`, `status`, `class`, `args`, `log`, `started`, `ended`) VALUES
(1, NULL, '3946325', 'completed', 'EasyAdmin\\Job\\CronTasks', '{\"tasks\":{\"session_8\":{\"enabled\":true,\"frequency\":\"hourly\"}},\"manual\":false}', NULL, '2026-10-04 06:45:52', '2026-10-04 06:45:52'),
(2, 3, '721748', 'completed', 'EasyAdmin\\Job\\CronTasks', '{\"tasks\":{\"session_8\":{\"enabled\":true,\"frequency\":\"hourly\"}},\"manual\":false}', NULL, '2026-10-05 13:15:26', '2026-10-05 13:15:27'),
(3, 3, '763285', 'completed', 'EasyAdmin\\Job\\CronTasks', '{\"tasks\":{\"session_8\":{\"enabled\":true,\"frequency\":\"hourly\"}},\"manual\":false}', NULL, '2026-10-05 14:34:23', '2026-10-05 14:34:23'),
(4, 3, '763976', 'completed', 'Omeka\\Job\\BatchDelete', '{\"resource\":\"items\",\"query\":{\"sort_by_default\":\"\",\"sort_order_default\":\"\"}}', NULL, '2026-10-05 14:35:48', '2026-10-05 14:35:48'),
(5, 3, '2470258', 'completed', 'EasyAdmin\\Job\\CronTasks', '{\"tasks\":{\"session_8\":{\"enabled\":true,\"frequency\":\"hourly\"}},\"manual\":false}', NULL, '2026-10-17 06:22:41', '2026-10-17 06:22:41'),
(6, 3, '2508424', 'completed', 'EasyAdmin\\Job\\CronTasks', '{\"tasks\":{\"session_8\":{\"enabled\":true,\"frequency\":\"hourly\"}},\"manual\":false}', NULL, '2026-10-17 07:26:09', '2026-10-17 07:26:10'),
(7, 3, '4165778', 'completed', 'EasyAdmin\\Job\\CronTasks', '{\"tasks\":{\"session_8\":{\"enabled\":true,\"frequency\":\"hourly\"}},\"manual\":false}', NULL, '2026-10-19 05:34:32', '2026-10-19 05:34:33'),
(8, 3, '83900', 'completed', 'EasyAdmin\\Job\\CronTasks', '{\"tasks\":{\"session_8\":{\"enabled\":true,\"frequency\":\"hourly\"}},\"manual\":false}', NULL, '2026-10-19 08:41:14', '2026-10-19 08:41:14');

-- --------------------------------------------------------

--
-- Structure de la table `log`
--

CREATE TABLE `log` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `job_id` int(11) DEFAULT NULL,
  `reference` varchar(190) NOT NULL DEFAULT '',
  `severity` int(11) NOT NULL DEFAULT 0,
  `message` longtext NOT NULL,
  `context` longtext NOT NULL COMMENT '(DC2Type:json)',
  `created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `log`
--

INSERT INTO `log` (`id`, `owner_id`, `job_id`, `reference`, `severity`, `message`, `context`, `created`) VALUES
(1, NULL, 1, 'easy-admin/cron/job_1', 5, 'Starting cron execution with {count} tasks.', '{\"count\":1}', '2026-10-04 06:45:52'),
(2, NULL, 1, 'easy-admin/cron/job_1', 6, 'Executing task \"{task}\".', '{\"task\":\"session_8\"}', '2026-10-04 06:45:52'),
(3, NULL, 1, 'easy-admin/cron/job_1', 5, 'Cron execution completed: {executed} tasks executed, {errors} errors.', '{\"executed\":1,\"errors\":0}', '2026-10-04 06:45:52'),
(4, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Item entity with criteria {\"id\":\"2147483647\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(462): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(233): Omeka\\Api\\Adapter\\AbstractEntityAdapter->update()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(136): Omeka\\Api\\Manager->execute()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(56): Omeka\\Api\\Manager->update()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(403): Omeka\\Controller\\ApiController->patch()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#15 {main}', '{\"url\":\"/omk_chaoticumseminario/api/items/2147483647?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-04 06:46:23'),
(5, 3, 2, 'easy-admin/cron/job_2', 5, 'Starting cron execution with {count} tasks.', '{\"count\":1}', '2026-10-05 13:15:27'),
(6, 3, 2, 'easy-admin/cron/job_2', 6, 'Executing task \"{task}\".', '{\"task\":\"session_8\"}', '2026-10-05 13:15:27'),
(7, 3, 2, 'easy-admin/cron/job_2', 5, 'Cron execution completed: {executed} tasks executed, {errors} errors.', '{\"executed\":1,\"errors\":0}', '2026-10-05 13:15:27'),
(8, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-05 13:16:19'),
(9, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-05 13:16:19'),
(10, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-05 13:38:21'),
(11, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-05 13:38:21'),
(12, 3, 3, 'easy-admin/cron/job_3', 5, 'Starting cron execution with {count} tasks.', '{\"count\":1}', '2026-10-05 14:34:23'),
(13, 3, 3, 'easy-admin/cron/job_3', 6, 'Executing task \"{task}\".', '{\"task\":\"session_8\"}', '2026-10-05 14:34:23'),
(14, 3, 3, 'easy-admin/cron/job_3', 5, 'Cron execution completed: {executed} tasks executed, {errors} errors.', '{\"executed\":1,\"errors\":0}', '2026-10-05 14:34:23'),
(15, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-05 14:37:31'),
(16, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-05 14:37:31'),
(17, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.4\",\"userAgent\":\"node\"}', '2026-10-05 14:42:25'),
(18, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.4\",\"userAgent\":\"node\"}', '2026-10-05 14:42:25'),
(19, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Item entity with criteria {\"id\":\"1997\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/items/1997?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:36:47'),
(20, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Item entity with criteria {\"id\":\"1996\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/items/1996?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:37:00'),
(21, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:34');
INSERT INTO `log` (`id`, `owner_id`, `job_id`, `reference`, `severity`, `message`, `context`, `created`) VALUES
(22, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:34'),
(23, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:34'),
(24, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:35'),
(25, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:35'),
(26, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:35'),
(27, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:35'),
(28, 3, NULL, '', 3, 'Omeka\\File\\Exception\\RuntimeException: Directory \"/var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original\" is not writable. in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php:105\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/Store/Local.php(46): Omeka\\File\\Store\\Local->assurePathDirectories()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(227): Omeka\\File\\Store\\Local->put()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(238): Omeka\\File\\TempFile->store()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/File/TempFile.php(435): Omeka\\File\\TempFile->storeOriginal()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Media/Ingester/Upload.php(61): Omeka\\File\\TempFile->mediaIngestFile()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/MediaAdapter.php(170): Omeka\\Media\\Ingester\\Upload->ingest()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(653): Omeka\\Api\\Adapter\\MediaAdapter->hydrate()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(364): Omeka\\Api\\Adapter\\AbstractEntityAdapter->hydrateEntity()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(224): Omeka\\Api\\Adapter\\AbstractEntityAdapter->create()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(78): Omeka\\Api\\Manager->execute()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(42): Omeka\\Api\\Manager->create()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(196): Omeka\\Controller\\ApiController->create()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(422): Omeka\\Controller\\ApiController->processPostData()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#16 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#17 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#18 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#19 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#20 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#21 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#22 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#23 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:39:36'),
(29, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omeka6ack58enne3tfaQ3PIy.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:42:58'),
(30, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaein4mb1s1bo02NFvube[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka6ack58enne3tfaQ3PIy.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:42:58'),
(31, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekacvl7qstb1qg5cyVFrJn.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:42:59'),
(32, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaqjhv108fbsa7aBtSRJt[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekacvl7qstb1qg5cyVFrJn.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:42:59'),
(33, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekaaq1qp4dvi7ageSe82Nz.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:50:19'),
(34, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekame7bh11q6if7eGLlMPc[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaaq1qp4dvi7ageSe82Nz.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-10-06 07:50:19'),
(35, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omeka524h2dj5vkedfdYHjl6.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-14 13:53:52'),
(36, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekakpumtco7k2491vBDUsD[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka524h2dj5vkedfdYHjl6.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-14 13:53:52'),
(37, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omeka0jgp77q05qiq7cJT8YI.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-14 13:53:52'),
(38, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka16rn2o1d3v198REV7uf[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka0jgp77q05qiq7cJT8YI.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-14 13:53:52'),
(39, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekakui79cb9g98o9I0bzbQ.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-14 13:57:48'),
(40, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekavi8s4kkfaaj70DtyTHA[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekakui79cb9g98o9I0bzbQ.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-14 13:57:48'),
(41, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekaeuncdlidborpfqQCqTR.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-17 06:22:35'),
(42, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekavb7i4pav1bpi6rvqiIE[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaeuncdlidborpfqQCqTR.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-17 06:22:35'),
(43, 3, 5, 'easy-admin/cron/job_5', 5, 'Starting cron execution with {count} tasks.', '{\"count\":1}', '2026-10-17 06:22:41'),
(44, 3, 5, 'easy-admin/cron/job_5', 6, 'Executing task \"{task}\".', '{\"task\":\"session_8\"}', '2026-10-17 06:22:41'),
(45, 3, 5, 'easy-admin/cron/job_5', 5, 'Cron execution completed: {executed} tasks executed, {errors} errors.', '{\"executed\":1,\"errors\":0}', '2026-10-17 06:22:41'),
(46, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekapt0fluuml8rk7AgDQBT.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-17 06:27:28'),
(47, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekalonf6gttid3q2Kcfw0Z[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekapt0fluuml8rk7AgDQBT.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-17 06:27:28'),
(48, 3, 6, 'easy-admin/cron/job_6', 5, 'Starting cron execution with {count} tasks.', '{\"count\":1}', '2026-10-17 07:26:10'),
(49, 3, 6, 'easy-admin/cron/job_6', 6, 'Executing task \"{task}\".', '{\"task\":\"session_8\"}', '2026-10-17 07:26:10'),
(50, 3, 6, 'easy-admin/cron/job_6', 5, 'Cron execution completed: {executed} tasks executed, {errors} errors.', '{\"executed\":1,\"errors\":0}', '2026-10-17 07:26:10'),
(51, 3, 7, 'easy-admin/cron/job_7', 5, 'Starting cron execution with {count} tasks.', '{\"count\":1}', '2026-10-19 05:34:33'),
(52, 3, 7, 'easy-admin/cron/job_7', 6, 'Executing task \"{task}\".', '{\"task\":\"session_8\"}', '2026-10-19 05:34:33'),
(53, 3, 7, 'easy-admin/cron/job_7', 5, 'Cron execution completed: {executed} tasks executed, {errors} errors.', '{\"executed\":1,\"errors\":0}', '2026-10-19 05:34:33'),
(54, 3, 8, 'easy-admin/cron/job_8', 5, 'Starting cron execution with {count} tasks.', '{\"count\":1}', '2026-10-19 08:41:14'),
(55, 3, 8, 'easy-admin/cron/job_8', 6, 'Executing task \"{task}\".', '{\"task\":\"session_8\"}', '2026-10-19 08:41:14'),
(56, 3, 8, 'easy-admin/cron/job_8', 5, 'Cron execution completed: {executed} tasks executed, {errors} errors.', '{\"executed\":1,\"errors\":0}', '2026-10-19 08:41:14'),
(57, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekapip1qimi98f676atCyR.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-24 05:15:11'),
(58, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekap70jknhs54eaf7g2dDT[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekapip1qimi98f676atCyR.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-24 05:15:11'),
(59, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekadsd5a10l9o9o9pu95k2.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-24 05:15:12'),
(60, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekapfl3o7lhcvh3cyKB0Qy[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekadsd5a10l9o9o9pu95k2.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-24 05:15:12'),
(61, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekajihklvfdv3i1a0CKHtr.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-24 05:28:08'),
(62, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekajekru7rbti2n24pzQ9g[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekajihklvfdv3i1a0CKHtr.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-24 05:28:08'),
(63, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekaa1nmcbmdppff1IVQqXN.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-27 14:26:38'),
(64, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekado54k9uari5o5M4BwvT[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaa1nmcbmdppff1IVQqXN.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-27 14:26:38'),
(65, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/746.\nconvert: no images defined `/tmp/omekad8ip3mtobojdcA41Pmt.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-27 14:26:38'),
(66, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekakbk8hvctht0b1oxiccC[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekad8ip3mtobojdcA41Pmt.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.2\",\"userAgent\":\"node\"}', '2026-10-27 14:26:38'),
(67, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaiqvbhi6i7e898NUWH5m.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-02 15:39:39'),
(68, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekadvpl5ogii3gtf5Xr72L[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaiqvbhi6i7e898NUWH5m.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-02 15:39:39'),
(69, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaravbo7slffnmaxcqjQp.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-02 15:39:39'),
(70, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka63qbtt23r3jgdAlqrYT[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaravbo7slffnmaxcqjQp.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-02 15:39:39'),
(71, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka7dsoqlp7tmqm1thaxmV.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 05:54:53'),
(72, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekamqrfla51o5ofbeg2SiS[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka7dsoqlp7tmqm1thaxmV.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 05:54:54'),
(73, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka68gnd2uc4p9h3pQm2x7.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 05:54:54'),
(74, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekagmdagtn6v6me7c0yLoJ[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka68gnd2uc4p9h3pQm2x7.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 05:54:54'),
(75, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaq58q7g7ea9fm4zkA5t4.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:11:56'),
(76, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaopd5kpk3dqi28qwnzBc[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaq58q7g7ea9fm4zkA5t4.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:11:56'),
(77, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka1fjkflrmkai35h0Zk6e.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:13:31'),
(78, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaqaajvkgj4plqcB5DwfN[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka1fjkflrmkai35h0Zk6e.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:13:31'),
(79, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekalee18817gbsf7CIzbAS.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:14:10'),
(80, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaq2ssp90j8surb5JaCaY[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekalee18817gbsf7CIzbAS.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:14:10'),
(81, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekas332rmif1ecu29fBK22.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:18:31'),
(82, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaum4s8mc961ag60L3fBl[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekas332rmif1ecu29fBK22.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:18:31'),
(83, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaari2oghikdm5etaSyF3.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:21:00');
INSERT INTO `log` (`id`, `owner_id`, `job_id`, `reference`, `severity`, `message`, `context`, `created`) VALUES
(84, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekae14sulb9orbv1UWsXyb[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaari2oghikdm5etaSyF3.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:21:00'),
(85, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaemsm2b9enl2i0qNHvzu.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:23:20'),
(86, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka7f4ro0nesm3oeJlE2Ko[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaemsm2b9enl2i0qNHvzu.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:23:20'),
(87, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekajatf97tuvj6d5PDuqCG.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:24:48'),
(88, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaatsf36piodff9tTcJe1[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekajatf97tuvj6d5PDuqCG.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:24:48'),
(89, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaotqf5s8d0i8tbP3m2ml.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:31:08'),
(90, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekapmfp8nm59r6tduaxPDC[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaotqf5s8d0i8tbP3m2ml.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:31:08'),
(91, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekag2q74pvg4tsdfdV66z0.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:31:49'),
(92, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka3pqi5t828a9gc7ICC0J[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekag2q74pvg4tsdfdV66z0.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:31:49'),
(93, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka73hh77ht96jnaDIVRwb.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:32:32'),
(94, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaqghca287ikvq0dssnRF[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka73hh77ht96jnaDIVRwb.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:32:32'),
(95, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaf5g8se55acue5fO7Rz1.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:33:26'),
(96, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka0giet00qbptcfqF8YU7[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaf5g8se55acue5fO7Rz1.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:33:26'),
(97, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka7c0m2686r81a80Qh0mW.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:37:57'),
(98, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaukrkufmjeamc2FHTyvY[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka7c0m2686r81a80Qh0mW.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 06:37:57'),
(99, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekajmd68ibsiskc8fyGLqV.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:01:07'),
(100, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekach6vnqoupcm56Qwjj4u[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekajmd68ibsiskc8fyGLqV.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:01:07'),
(101, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka7e0dmac708l9c2aINAE.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:02:13'),
(102, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekafujib9foavd72HzdjBD[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka7e0dmac708l9c2aINAE.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:02:13'),
(103, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaftobjus2fdsp5d7rxtp.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:05:08'),
(104, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaa4hghll9iq253JfIjvB[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaftobjus2fdsp5d7rxtp.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:05:08'),
(105, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka2sn07bf2032sfz45Knw.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:06:14'),
(106, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekarrn13o7an8o03tq2Bh4[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka2sn07bf2032sfz45Knw.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:06:14'),
(107, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaaevroq3rr1mke5Rgtzm.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:06:18'),
(108, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekagf5nb4mocti1f59BvG1[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaaevroq3rr1mke5Rgtzm.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:06:18'),
(109, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaim7aktgkm04nc9yg2am.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:14:24'),
(110, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka4rlkhihgehr6f2Kaiyv[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaim7aktgkm04nc9yg2am.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:14:24'),
(111, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekalftunvfti317cTZueUd.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:14:36'),
(112, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka01vna30359k3fc8gZKV[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekalftunvfti317cTZueUd.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:14:36'),
(113, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekavpvfrk3f4unmdMTVxuU.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:16:20'),
(114, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaja6d30kta1tobfPZU9v[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekavpvfrk3f4unmdMTVxuU.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:16:20'),
(115, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekam9mddqndb5o8fugwC3s.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:19:37'),
(116, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekacdegnc26tg0u2J4on85[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekam9mddqndb5o8fugwC3s.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:19:37'),
(117, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekapr8mm52d20917m2R94Y.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:19:38'),
(118, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaolhan789ka3f09RhR8y[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekapr8mm52d20917m2R94Y.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:19:38'),
(119, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekatuv8vhmrdomi2H7N3m5.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:19:39'),
(120, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekamgffg7ssh6o22JAZFg8[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekatuv8vhmrdomi2H7N3m5.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:19:39'),
(121, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2097\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2097?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:19:39'),
(122, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka2ds2i8tb7tjneMXmizn.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:01'),
(123, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka319ds4l2ubqf5heXaGB[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka2ds2i8tb7tjneMXmizn.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:01'),
(124, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekagiod6li7m4pddduEDep.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:06'),
(125, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekapc0mmtls6ll47aYVDdR[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekagiod6li7m4pddduEDep.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:06'),
(126, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekadt423pa0a1v64hLpcfu.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:06'),
(127, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekau02jdq0rdgso2VE3Esk[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekadt423pa0a1v64hLpcfu.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:06'),
(128, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekapma3f4o0gdg29GeMrom.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:06'),
(129, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekapt1km2q70p9f8phB7ri[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekapma3f4o0gdg29GeMrom.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:06'),
(130, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2100\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2100?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:07'),
(131, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2100\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2100?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:07'),
(132, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekadd9tvu8lpv0k54dUabU.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:10'),
(133, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka3f03vs8gpc08dEBvcQq[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekadd9tvu8lpv0k54dUabU.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:10'),
(134, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekackte0802641s6CbqVxt.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:15'),
(135, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekabjrlfvlk357gfHmJw4h[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekackte0802641s6CbqVxt.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:15'),
(136, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekas7ds1keot8ecfQrBqAb.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:18'),
(137, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekamfninb7e0rr37HooH3R[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekas7ds1keot8ecfQrBqAb.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:18'),
(138, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekac2uqupjb2e1s4sKZGys.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:20'),
(139, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekajrh4etvb1dvj7TE3r0k[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekac2uqupjb2e1s4sKZGys.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:20'),
(140, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka1q83geberstm7RkhpJc.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:21'),
(141, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka8kmkkccr1mp6fOEogFp[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka1q83geberstm7RkhpJc.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:21'),
(142, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2106\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2106?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:21'),
(143, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka4qkdtcr5mu2520kwAAm.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(144, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekak0bikkbis1ir0oHYinx[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka4qkdtcr5mu2520kwAAm.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(145, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka8rp2uso1qdqb200ZVvi.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(146, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaf4729e5e8e4ecXlOSVD[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka8rp2uso1qdqb200ZVvi.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(147, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekas6t7r7c56q69dHTskLL.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(148, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka435bp9q1toic8MiQMhQ[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekas6t7r7c56q69dHTskLL.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(149, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekav7rmstontkc3bWUgCEf.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(150, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka9b71gsl5g1bm3AkSK9h[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekav7rmstontkc3bWUgCEf.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(151, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2107\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2107?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(152, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2107\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2107?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(153, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2107\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2107?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24');
INSERT INTO `log` (`id`, `owner_id`, `job_id`, `reference`, `severity`, `message`, `context`, `created`) VALUES
(154, 3, NULL, '', 4, 'Cannot delete file; file does not exist /var/www/html/humanum-p8/_site/omk_chaoticumseminario/files/original/c981942ea52aa48244b8fa9a36f587f19bf0c48c.json', '{\"url\":\"/omk_chaoticumseminario/api/media/2108?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:24'),
(155, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2108\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2108?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:25'),
(156, 3, NULL, '', 3, 'Omeka\\Api\\Exception\\NotFoundException: Omeka\\Entity\\Media entity with criteria {\"id\":\"2108\"} not found in /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php:732\nStack trace:\n#0 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(606): Omeka\\Api\\Adapter\\AbstractEntityAdapter->findEntity()\n#1 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Adapter/AbstractEntityAdapter.php(531): Omeka\\Api\\Adapter\\AbstractEntityAdapter->deleteEntity()\n#2 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(239): Omeka\\Api\\Adapter\\AbstractEntityAdapter->delete()\n#3 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Api/Manager.php(164): Omeka\\Api\\Manager->execute()\n#4 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(63): Omeka\\Api\\Manager->delete()\n#5 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(358): Omeka\\Controller\\ApiController->delete()\n#6 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/application/src/Controller/ApiController.php(169): Laminas\\Mvc\\Controller\\AbstractRestfulController->onDispatch()\n#7 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Omeka\\Controller\\ApiController->onDispatch()\n#8 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#9 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractController.php(105): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#10 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Controller/AbstractRestfulController.php(306): Laminas\\Mvc\\Controller\\AbstractController->dispatch()\n#11 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/DispatchListener.php(117): Laminas\\Mvc\\Controller\\AbstractRestfulController->dispatch()\n#12 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(318): Laminas\\Mvc\\DispatchListener->onDispatch()\n#13 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/laminas/laminas-eventmanager/src/EventManager.php(176): Laminas\\EventManager\\EventManager->triggerListeners()\n#14 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/vendor/omeka/sanimal-mvc/src/Application.php(319): Laminas\\EventManager\\EventManager->triggerEventUntil()\n#15 /var/www/html/humanum-p8/_site/omk_chaoticumseminario/index.php(26): Laminas\\Mvc\\Application->run()\n#16 {main}', '{\"url\":\"/omk_chaoticumseminario/api/media/2108?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:25'),
(157, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekavpegektj2cvh5jA1Eiu.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:50'),
(158, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekapiefbb1qlkm83UTBhIJ[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekavpegektj2cvh5jA1Eiu.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:50'),
(159, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekafvn63dt8khsac4HRowC.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:59'),
(160, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaptbs3aa7a6bacvdicRe[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekafvn63dt8khsac4HRowC.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:20:59'),
(161, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekan9hi0veg23m04QCmT65.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:07'),
(162, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omeka1vetn8n1a5i5duBv5JP[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekan9hi0veg23m04QCmT65.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:07'),
(163, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekasfeq35lrtj7v9oosOky.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:14'),
(164, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekau6qkbhlka3lo40onZQp[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekasfeq35lrtj7v9oosOky.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:14'),
(165, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekaujac2q24i8f42w76gmr.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:22'),
(166, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekafp7o5aqjnjlm2SKkp55[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekaujac2q24i8f42w76gmr.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:22'),
(167, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekap2lifdj0t5med1obMfJ.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:31'),
(168, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekatrnhhrto9lqkdQKyO8m[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekap2lifdj0t5med1obMfJ.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:31'),
(169, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekajq2i5sj3j4ftec6qges.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:39'),
(170, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekal18mblgr0bmo5bKIE2H[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekajq2i5sj3j4ftec6qges.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 07:21:39'),
(171, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka6j44efa43jsu3XARfAJ.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 09:11:04'),
(172, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekaj3bvnj5gmc0j7E4iako[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka6j44efa43jsu3XARfAJ.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 09:11:04'),
(173, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omekau68ikubp0kb456WM8MH.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 09:13:08'),
(174, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekarri5asp4c3f4fJ5y1Vu[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omekau68ikubp0kb456WM8MH.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 09:13:08'),
(175, 3, NULL, '', 3, 'convert: no decode delegate for this image format `\' @ error/constitute.c/ReadImage/752.\nconvert: no images defined `/tmp/omeka6n39ambco9mi9rpq9PC.jpg\' @ error/deprecate.c/ConvertImageCommand/3371.\n', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 09:19:21'),
(176, 3, NULL, '', 3, 'Command \"/usr/bin/convert \'/tmp/omekavqlp8c136bcjf9joakg[0]\' -auto-orient -background white +repage -alpha remove -thumbnail \'800x800>\' \'/tmp/omeka6n39ambco9mi9rpq9PC.jpg\'\" failed with status code 1.', '{\"url\":\"/omk_chaoticumseminario/api/media?key_identity=lUEpgv8pfL18z31fpetGNAxL5A1HKgPT&key_credential=bw5RoLoTV57dhV5853DI9pbfclpVOlOA\",\"ip\":\"172.25.0.3\",\"userAgent\":\"node\"}', '2026-11-20 09:19:21');

-- --------------------------------------------------------

--
-- Structure de la table `media`
--

CREATE TABLE `media` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `ingester` varchar(190) NOT NULL,
  `renderer` varchar(190) NOT NULL,
  `data` longtext DEFAULT NULL COMMENT '(DC2Type:json_array)',
  `source` longtext DEFAULT NULL,
  `media_type` varchar(190) DEFAULT NULL,
  `storage_id` varchar(190) DEFAULT NULL,
  `extension` varchar(190) DEFAULT NULL,
  `sha256` char(64) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `has_original` tinyint(1) NOT NULL,
  `has_thumbnails` tinyint(1) NOT NULL,
  `position` int(11) DEFAULT NULL,
  `lang` varchar(190) DEFAULT NULL,
  `alt_text` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `media`
--

INSERT INTO `media` (`id`, `item_id`, `ingester`, `renderer`, `data`, `source`, `media_type`, `storage_id`, `extension`, `sha256`, `size`, `has_original`, `has_thumbnails`, `position`, `lang`, `alt_text`) VALUES
(2014, 2013, 'upload', 'file', NULL, 'partition_2026-10-14T13-53-51-864Z.json', 'application/json', 'ed18146a1fcdbfb28a3ada4ea62b5fa47076bbee', 'json', 'efcf67476cea11cf0441bf9e759451fec5460d578791d08d12dda16bf31dc4b1', 22448, 1, 0, NULL, NULL, NULL),
(2015, 2013, 'upload', 'file', NULL, 'rapport_chaoticum_2026-10-14T13-53-51-864Z.md', 'text/plain', 'a2b60d66c1bee5356651a69bfcdca8f9dbc5db84', 'md', 'e58fa4ea877e5b686d719e832577d915a9a0e8ddd3b246e2c80cb71de85617fd', 11942, 1, 0, NULL, NULL, NULL),
(2016, 2013, 'upload', 'file', NULL, 'diapo_02_2026-10-14T13-53-51-864Z.png', 'image/png', '409434393d00d8533510ca4909f66f311f91c527', 'png', '11f88be312e32f8c13247e2d982657cca8f5e9bd630c8c0ec97bc6b5549117bb', 124863, 1, 1, NULL, NULL, NULL),
(2017, 2013, 'upload', 'file', NULL, 'diapo_07_2026-10-14T13-53-51-864Z.png', 'image/png', 'dd3847d3276e8de336f9eb18f50c0720beaa85b4', 'png', 'daa2c502c946cffa2b6e496b7a28d1c296f55484190b8c086cd66a776b56a974', 202096, 1, 1, NULL, NULL, NULL),
(2018, 2013, 'upload', 'file', NULL, 'diapo_12_2026-10-14T13-53-51-864Z.png', 'image/png', 'f44775d2de0f56fd2ea46451e1c41462a6f92204', 'png', '0f2f29e863767124cb836791ac81ad4de73043077e33a0b1f61c74bc4778377f', 124692, 1, 1, NULL, NULL, NULL),
(2019, 2013, 'upload', 'file', NULL, 'diapo_17_2026-10-14T13-53-51-864Z.png', 'image/png', 'e26c141a39d7059f8a014e782984f5c3e0ce2d70', 'png', 'a623eeb9a2589c4f12ced270af47197f9dad567148552798ab02ce85ce624fd3', 174891, 1, 1, NULL, NULL, NULL),
(2020, 2013, 'upload', 'file', NULL, 'diapo_22_2026-10-14T13-53-51-864Z.png', 'image/png', '9822a45fd169e8b15d4dfbd8d822fb24439b15a9', 'png', '69987a440d2618504ddffb077c3517bd08b7d2d682059e1e6a69571ecc3d1125', 688489, 1, 1, NULL, NULL, NULL),
(2021, 2013, 'upload', 'file', NULL, 'diapo_27_2026-10-14T13-53-51-864Z.png', 'image/png', '3302d0a6eabed07ed7adf05cb9a7038acebc6454', 'png', '6da63796b382e717b633d146975dc70ae6831a03617121371a818f46fafc0983', 572450, 1, 1, NULL, NULL, NULL),
(2023, 2022, 'upload', 'file', NULL, 'participation_2026-10-14T13-57-46-873Z-5c18c3.json', 'application/json', '88f4eb9a05161165813d8a3e7a4a567a280e4d06', 'json', '9ff2a7da8fdd21ae804cafa608e900631df99b5067741ed019aa31f23a9e0172', 6488, 1, 0, NULL, NULL, NULL),
(2025, 2024, 'upload', 'file', NULL, 'participation_2026-10-17T06-22-33-415Z-8523f5.json', 'application/json', 'e3f1993b217ca05f1ae94e28c49e4e38fd54b352', 'json', '42a2e5572a693901be9dfdf14223c178d885a481eee6e47ee55b1f53881e9f88', 28128, 1, 0, NULL, NULL, NULL),
(2027, 2026, 'upload', 'file', NULL, 'participation_2026-10-17T06-27-26-080Z-65af31.json', 'application/json', '7a9b6b1850b9b470a84f420c58c779a7f118f779', 'json', 'ed159679405e609ccbfba60a4a88f1994acafc86d7ef111bbf28c7c9915c4e18', 1198, 1, 0, NULL, NULL, NULL),
(2029, 2028, 'upload', 'file', NULL, 'partition_2026-10-24T05-15-11-300Z.json', 'application/json', '09d352b1d7072e33c1366618bb99e7c0d42fb314', 'json', '6c13188577003d3f95bd4be30e46090beba1408d1684592778c273f1118b5d27', 30510, 1, 0, NULL, NULL, NULL),
(2030, 2028, 'upload', 'file', NULL, 'rapport_chaoticum_2026-10-24T05-15-11-300Z.md', 'text/plain', 'd94c13e0d7a415ac6f811bb7be284fede2596126', 'md', 'bef52af4f82776781c8450d5f1d8a7c88b1e051f26cfdd92a793fa1ca3a3e071', 15414, 1, 0, NULL, NULL, NULL),
(2031, 2028, 'upload', 'file', NULL, 'diapo_02_2026-10-24T05-15-11-300Z.png', 'image/png', '1103fa6c6a016708a7907bf0bc198792aa6adb5e', 'png', '629abd4db557d0d748cf71ee51d3f85d386122f18c5c0f7a97bc50cddf57cae3', 572778, 1, 1, NULL, NULL, NULL),
(2032, 2028, 'upload', 'file', NULL, 'diapo_06_2026-10-24T05-15-11-300Z.png', 'image/png', 'c3caedf5e22497e78c6a2dbb060a4acfa0a505fa', 'png', '76f13310007da5093b7ba4e4ee96fdb024304d449533b069e08deed78d326c4b', 120100, 1, 1, NULL, NULL, NULL),
(2033, 2028, 'upload', 'file', NULL, 'diapo_10_2026-10-24T05-15-11-300Z.png', 'image/png', '0cf7fc0cff080ee1190f11cbefd30fa3bcf4afe9', 'png', '61496ef02d87a66258f96b335d437f62e5d7d0a79d9a0ebaaac014e534689f82', 78663, 1, 1, NULL, NULL, NULL),
(2034, 2028, 'upload', 'file', NULL, 'diapo_14_2026-10-24T05-15-11-300Z.png', 'image/png', '3987b6c2746a5b4ccbef8c34e884459db706628d', 'png', '78e911b72d3be0fc3c9b51f830b85ed1515036db859b0ae50bf4c5ccdd43eca8', 143036, 1, 1, NULL, NULL, NULL),
(2035, 2028, 'upload', 'file', NULL, 'diapo_18_2026-10-24T05-15-11-300Z.png', 'image/png', '02b6de5b4a756bf488bb2d6930870adc26273a4a', 'png', 'cfb9033486ca10829c9a34fb2388c085153bec26559d53273e213f66fe332a34', 219950, 1, 1, NULL, NULL, NULL),
(2036, 2028, 'upload', 'file', NULL, 'diapo_22_2026-10-24T05-15-11-300Z.png', 'image/png', 'be69c725f52415dc92d72ee5ba629552ae2ef964', 'png', '3d76910a5379eee84e35b79020d5b8c8fb638ebe85015cbb1cef950f63954ce0', 204823, 1, 1, NULL, NULL, NULL),
(2037, 2028, 'upload', 'file', NULL, 'diapo_26_2026-10-24T05-15-11-300Z.png', 'image/png', '40c861ece0f79c549bf5810de8adf78c15bcfc96', 'png', 'a7ebc4eb298c7ca6b3162aec86b2fc07e22cc35a8d76987f156f50f962c06168', 165609, 1, 1, NULL, NULL, NULL),
(2038, 2028, 'upload', 'file', NULL, 'diapo_30_2026-10-24T05-15-11-300Z.png', 'image/png', '7c2dbf94018a5ac88b27c31e778bd8e373513384', 'png', '3f1192b7de34efe09dad391f7ac43e16a5a509a1ece56b36d2a247875370e4a4', 497440, 1, 1, NULL, NULL, NULL),
(2040, 2039, 'upload', 'file', NULL, 'participation_2026-10-24T05-28-06-155Z-4fc2e2.json', 'application/json', '6c95b03ed5a3ccaa52bc5d8c8e954cccc34c8a9f', 'json', '98e857be1040f60e3241bd074841d9d099206b646ff717df254e90ae4cd54ab5', 6897, 1, 0, NULL, NULL, NULL),
(2042, 2041, 'upload', 'file', NULL, 'partition_2026-10-27T14-26-38-245Z.json', 'application/json', 'a3237442110dd3d67deae35a737c9acef936265a', 'json', '81f3d14eb4519598b667fada52f7cd2b6a5a4000e02b8618ad40ada1950c814e', 34980, 1, 0, NULL, NULL, NULL),
(2043, 2041, 'upload', 'file', NULL, 'rapport_chaoticum_2026-10-27T14-26-38-245Z.md', 'text/plain', '0b0efe9507923bd7a9e67f6ab0f14570b1100ea5', 'md', '0806c49f8ffc20be5ddb65b389ecbe478039007f7973e2151b9c5de314cf826d', 14649, 1, 0, NULL, NULL, NULL),
(2044, 2041, 'upload', 'file', NULL, 'diapo_02_2026-10-27T14-26-38-245Z.png', 'image/png', 'c5f3d311b885f30e6fc6045e8b685d1c07507dc4', 'png', '7dc2456f779f1ce39fc53dd4f8818160df7705efb43b4b62b291c69d1db16212', 124717, 1, 1, NULL, NULL, NULL),
(2045, 2041, 'upload', 'file', NULL, 'diapo_06_2026-10-27T14-26-38-245Z.png', 'image/png', '4858cb5a5d1aff9f8e5e9f6a4e66940b11a264e2', 'png', '1b0e115a2e6624b4232a2bd8f348a065f56815392c34486ef21ffb88b0536622', 558947, 1, 1, NULL, NULL, NULL),
(2046, 2041, 'upload', 'file', NULL, 'diapo_10_2026-10-27T14-26-38-245Z.png', 'image/png', '2b8e85f3ab5c316be000dabbc8afdf5ef95f63c7', 'png', '69987a440d2618504ddffb077c3517bd08b7d2d682059e1e6a69571ecc3d1125', 688489, 1, 1, NULL, NULL, NULL),
(2047, 2041, 'upload', 'file', NULL, 'diapo_14_2026-10-27T14-26-38-245Z.png', 'image/png', '3fe9f9922cc2c2a544b82dcf3f2a9a66752f8eea', 'png', '742a7e22841488d69dbce7709a0a7728ff3160bc82ff2177e404b8a117b642c6', 343150, 1, 1, NULL, NULL, NULL),
(2048, 2041, 'upload', 'file', NULL, 'diapo_18_2026-10-27T14-26-38-245Z.png', 'image/png', 'db09b6ef07458428b36a985126c2bc3d83a19c1a', 'png', '96f32edd904edc1f99f43db74f69d1abdd3e9a623ccfdc8367d56dc82d8cb884', 193762, 1, 1, NULL, NULL, NULL),
(2049, 2041, 'upload', 'file', NULL, 'diapo_22_2026-10-27T14-26-38-245Z.png', 'image/png', '434e7b30842dcbad9cf90b58579c335428a4b465', 'png', '545e17d4b59e6ec0483d65458167700894342da46bc2b1c6bf5c0fce2f24a9e3', 246991, 1, 1, NULL, NULL, NULL),
(2050, 2041, 'upload', 'file', NULL, 'diapo_26_2026-10-27T14-26-38-245Z.png', 'image/png', '6fde972e85082161a3bd7d1f42bb67deda131dba', 'png', '1130f2f39f7cd7e634ed17f6474a74d8b723d7a9621b425a5b5018d8c4512cd1', 108149, 1, 1, NULL, NULL, NULL),
(2051, 2041, 'upload', 'file', NULL, 'diapo_30_2026-10-27T14-26-38-245Z.png', 'image/png', '54df633372b638c76db6835662d7de9b7841a62e', 'png', '0523515615387caf6ffaa448ff40c492ddbfcffd8d08768777344cc3f390b766', 203957, 1, 1, NULL, NULL, NULL),
(2053, 2052, 'upload', 'file', NULL, 'partition_2026-11-02T15-39-38-915Z.json', 'application/json', '96253f045514fe5ec08572c40abdf0d463ac0d77', 'json', 'e581a90ef919c1d2bcf6e4715865b47441f8fe9554895169ba93d1906dfecc96', 23296, 1, 0, NULL, NULL, NULL),
(2054, 2052, 'upload', 'file', NULL, 'rapport_chaoticum_2026-11-02T15-39-38-915Z.md', 'text/plain', '499df61f2ba9b6905cbc50987b3671cf1f5afc9a', 'md', 'd13300a5c7dfa217df00f69efa418cc597f24b50dba4dadcfff6c08c709aed1d', 12419, 1, 0, NULL, NULL, NULL),
(2055, 2052, 'upload', 'file', NULL, 'diapo_02_2026-11-02T15-39-38-915Z.png', 'image/png', 'b7c90deab8e6c7ef8223725db39c6740217ca783', 'png', '7dc2456f779f1ce39fc53dd4f8818160df7705efb43b4b62b291c69d1db16212', 124717, 1, 1, NULL, NULL, NULL),
(2056, 2052, 'upload', 'file', NULL, 'diapo_07_2026-11-02T15-39-38-915Z.png', 'image/png', '5fb8663ea75dd20f3f0473b7c0ad6d80d58ee463', 'png', '08b09079a00b8992e4f727b43b49bc24fdf793aa121c120ef7732c53b4761aca', 149466, 1, 1, NULL, NULL, NULL),
(2057, 2052, 'upload', 'file', NULL, 'diapo_12_2026-11-02T15-39-38-915Z.png', 'image/png', '499d7951a64381f1b62ac2fc741813e770cc97fc', 'png', 'c7e4a137976320a2f6175305238741c99e1d5f28d9d3459c9f4fc12eb14ca802', 219353, 1, 1, NULL, NULL, NULL),
(2058, 2052, 'upload', 'file', NULL, 'diapo_17_2026-11-02T15-39-38-915Z.png', 'image/png', 'fe876f154897edb5590482334b8027efa8ec31b5', 'png', 'ab6c4100d11bf56f8f09f3284e50c14b0119080e7d17ef4a527163d3ee0c8963', 401404, 1, 1, NULL, NULL, NULL),
(2059, 2052, 'upload', 'file', NULL, 'diapo_22_2026-11-02T15-39-38-915Z.png', 'image/png', 'cc749af6895daa0e3af50faf8f26019f16a7bea1', 'png', '4105a1cf386519b839c21bd1e5475d3eb25c5c2d5d7878b3fe6dea7f26c60a27', 149376, 1, 1, NULL, NULL, NULL),
(2060, 2052, 'upload', 'file', NULL, 'diapo_27_2026-11-02T15-39-38-915Z.png', 'image/png', '69c49d9d1f14a7c17919065d1f76654d1c628eaf', 'png', '0c460b41f29922bd9017aa7287ca2e301405502161ba245fa26511af70b659f4', 246847, 1, 1, NULL, NULL, NULL),
(2063, 2061, 'upload', 'file', NULL, 'rapport_chaoticum_2026-11-20T05-54-53-641Z.md', 'text/plain', 'c0000a66cc686fc5dd8951a52c160bcdbe18f04c', 'md', 'df25a2222fb93e993819e3fd14e8c4d9d40f5d3255672b9fdb5622a2bc0b6ddd', 12387, 1, 0, NULL, NULL, NULL),
(2064, 2061, 'upload', 'file', NULL, 'diapo_02_2026-11-20T05-54-53-641Z.png', 'image/png', '9e82ae902c1551c7df56fba851d62b3905158d03', 'png', '14352cd653663bf357531f10d92bc74ea17abdd1804a5f2f7d8b1441ea08abf9', 439750, 1, 1, NULL, NULL, NULL),
(2065, 2061, 'upload', 'file', NULL, 'diapo_07_2026-11-20T05-54-53-641Z.png', 'image/png', 'fe0b4d14eb0b1f77ee2df79f0f4199f2b6e69aba', 'png', '5922466248335dd64cb841f4ff51af00a664d87a9e5678ee4e9e43612ac7751a', 695567, 1, 1, NULL, NULL, NULL),
(2066, 2061, 'upload', 'file', NULL, 'diapo_12_2026-11-20T05-54-53-641Z.png', 'image/png', '6f49befb864ed039734f73ff36c4ddc95006e9b7', 'png', '9795fac9dabe35110abdd1d5511d8f9e9352b10dd42e8a01977118032890a74a', 364363, 1, 1, NULL, NULL, NULL),
(2067, 2061, 'upload', 'file', NULL, 'diapo_17_2026-11-20T05-54-53-641Z.png', 'image/png', '9f8f414ffce504214636de2eed99986bd588f0ba', 'png', 'c9bfc5660a9b09c52dcda56b46a0b57b98d47289be3597b97792b66fd340984c', 459380, 1, 1, NULL, NULL, NULL),
(2068, 2061, 'upload', 'file', NULL, 'diapo_22_2026-11-20T05-54-53-641Z.png', 'image/png', '8a4e6ba5a06d94ebb8ca246b69db294746b817cf', 'png', 'fdf7813b97a90595e94731a758413c751ad8685a162e94c01fbc1aa7cb6def0c', 710414, 1, 1, NULL, NULL, NULL),
(2069, 2061, 'upload', 'file', NULL, 'diapo_27_2026-11-20T05-54-53-641Z.png', 'image/png', 'b3f35cbd35780f8b68d5d27219c063ca7cb2f263', 'png', 'ca8b5840a8e2875db6d76003edfec68bf9fdc1e8ca4d15bdb74c67f8297bd55c', 179114, 1, 1, NULL, NULL, NULL),
(2072, 2061, 'upload', 'file', NULL, 'diapo_emwol28ka.png', 'image/png', 'c0d47bbae0f2af5adfebc965d3ef822711bc3165', 'png', '927c3d31dcf9d7f3f5770e03dbc38f0afe2746818a8477f89a117f716916e0f9', 548245, 1, 1, NULL, NULL, NULL),
(2075, 2061, 'upload', 'file', NULL, 'diapo_emwol8o9k.png', 'image/png', '9144cee677dc9e03b7a0b692f9dad26b6c54c1c1', 'png', 'ab03dfa81f550edbe3b74623da5cd4bf609ac451b0309a597a3e42ade1c4bd9c', 322949, 1, 1, NULL, NULL, NULL),
(2078, 2061, 'upload', 'file', NULL, 'diapo_emwolev3w.png', 'image/png', '151812d5641c73b0f3ab015989d41b3d99cf7bbf', 'png', '321bbed2cf87e1e38398acae0bd62e7110d1cb5e5d531783c93b1165e108e21d', 165382, 1, 1, NULL, NULL, NULL),
(2082, 2061, 'upload', 'file', NULL, 'diapo_emwolprtx.png', 'image/png', '0d33b71993b5ff06c782aae93bbe6f5807aa87b5', 'png', '9edc959c7d688db3d1f522481ffeb5747631ebed066641e7a6cd1a0ab59fc527', 286841, 1, 1, NULL, NULL, NULL),
(2085, 2061, 'upload', 'file', NULL, 'diapo_emwolrudh.png', 'image/png', '4c21fd5f3fc01d5f5d082e779b7cf577add0a85b', 'png', '11f88be312e32f8c13247e2d982657cca8f5e9bd630c8c0ec97bc6b5549117bb', 124863, 1, 1, NULL, NULL, NULL),
(2087, 2061, 'upload', 'file', NULL, 'diapo_emwolxnsc.png', 'image/png', '995c85798a0b2fe52db59e396b74df6965af077a', 'png', '241d4cfe0cd7b07fce10cfaa7d3392b035faed1f64c5459c254c206028da3b54', 151500, 1, 1, NULL, NULL, NULL),
(2092, 2061, 'upload', 'file', NULL, 'diapo_emwomy1e2.png', 'image/png', '62858599d4ab956f8fd3470921561b8ceb8013aa', 'png', '6b73dec083cb1eeac24b908dbede2d4a76fc3dd2fab3203f921b095924026521', 46152, 1, 1, NULL, NULL, NULL),
(2121, 2061, 'upload', 'file', NULL, 'partition_2026-11-20T09-13-07-120Z.json', 'application/json', '339e81149b9c1109dfe201157f478ddedf38b9b9', 'json', '60a2c2a07cdd07e5799a493f519952e10c177ac45ce17156c321b60cd272af07', 33169, 1, 0, NULL, NULL, NULL),
(2123, 2122, 'upload', 'file', NULL, 'participation_2026-11-20T09-19-19-804Z-52aa24.json', 'application/json', '1512e7e5343d8189203c1dfe4ef9df44401a44dc', 'json', '69cdf9b7cd644ee88dcb192d4e2ce40f7a927181d4f76213bd9a81144c9ee0b0', 15765, 1, 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `migration`
--

CREATE TABLE `migration` (
  `version` varchar(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `migration`
--

INSERT INTO `migration` (`version`) VALUES
('20171128053327'),
('20180412035023'),
('20180919072656'),
('20180924033501'),
('20181002015551'),
('20181004043735'),
('20181106060421'),
('20190307043537'),
('20190319020708'),
('20190412090532'),
('20190423040354'),
('20190423071228'),
('20190514061351'),
('20190515055359'),
('20190729023728'),
('20190809092609'),
('20190815062003'),
('20200224022356'),
('20200226064602'),
('20200325091157'),
('20200326091310'),
('20200803000000'),
('20200831000000'),
('20210205101827'),
('20210225095734'),
('20210810083804'),
('20220718090449'),
('20220824103916'),
('20230124033031'),
('20230410074846'),
('20230523085358'),
('20230601060113'),
('20230713101012'),
('20231016000000'),
('20240103030617'),
('20240219000000'),
('20240614123811');

-- --------------------------------------------------------

--
-- Structure de la table `module`
--

CREATE TABLE `module` (
  `id` varchar(190) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `version` varchar(190) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `module`
--

INSERT INTO `module` (`id`, `is_active`, `version`) VALUES
('Annotate', 1, '3.4.13'),
('Common', 1, '3.4.92'),
('CustomVocab', 1, '2.1.0'),
('EasyAdmin', 1, '3.4.49'),
('Log', 1, '3.4.40');

-- --------------------------------------------------------

--
-- Structure de la table `password_creation`
--

CREATE TABLE `password_creation` (
  `id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `activate` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `password_creation`
--

INSERT INTO `password_creation` (`id`, `user_id`, `created`, `activate`) VALUES
('9qTnT82eeo629h1JBBIhHbh4lmj5TnbJ', 3, '2026-09-27 09:50:27', 1);

-- --------------------------------------------------------

--
-- Structure de la table `property`
--

CREATE TABLE `property` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `vocabulary_id` int(11) NOT NULL,
  `local_name` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `label` varchar(255) NOT NULL,
  `comment` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `property`
--

INSERT INTO `property` (`id`, `owner_id`, `vocabulary_id`, `local_name`, `label`, `comment`) VALUES
(1, NULL, 1, 'title', 'Title', 'A name given to the resource.'),
(2, NULL, 1, 'creator', 'Creator', 'An entity primarily responsible for making the resource.'),
(3, NULL, 1, 'subject', 'Subject', 'The topic of the resource.'),
(4, NULL, 1, 'description', 'Description', 'An account of the resource.'),
(5, NULL, 1, 'publisher', 'Publisher', 'An entity responsible for making the resource available.'),
(6, NULL, 1, 'contributor', 'Contributor', 'An entity responsible for making contributions to the resource.'),
(7, NULL, 1, 'date', 'Date', 'A point or period of time associated with an event in the lifecycle of the resource.'),
(8, NULL, 1, 'type', 'Type', 'The nature or genre of the resource.'),
(9, NULL, 1, 'format', 'Format', 'The file format, physical medium, or dimensions of the resource.'),
(10, NULL, 1, 'identifier', 'Identifier', 'An unambiguous reference to the resource within a given context.'),
(11, NULL, 1, 'source', 'Source', 'A related resource from which the described resource is derived.'),
(12, NULL, 1, 'language', 'Language', 'A language of the resource.'),
(13, NULL, 1, 'relation', 'Relation', 'A related resource.'),
(14, NULL, 1, 'coverage', 'Coverage', 'The spatial or temporal topic of the resource, the spatial applicability of the resource, or the jurisdiction under which the resource is relevant.'),
(15, NULL, 1, 'rights', 'Rights', 'Information about rights held in and over the resource.'),
(16, NULL, 1, 'audience', 'Audience', 'A class of entity for whom the resource is intended or useful.'),
(17, NULL, 1, 'alternative', 'Alternative Title', 'An alternative name for the resource.'),
(18, NULL, 1, 'tableOfContents', 'Table Of Contents', 'A list of subunits of the resource.'),
(19, NULL, 1, 'abstract', 'Abstract', 'A summary of the resource.'),
(20, NULL, 1, 'created', 'Date Created', 'Date of creation of the resource.'),
(21, NULL, 1, 'valid', 'Date Valid', 'Date (often a range) of validity of a resource.'),
(22, NULL, 1, 'available', 'Date Available', 'Date (often a range) that the resource became or will become available.'),
(23, NULL, 1, 'issued', 'Date Issued', 'Date of formal issuance (e.g., publication) of the resource.'),
(24, NULL, 1, 'modified', 'Date Modified', 'Date on which the resource was changed.'),
(25, NULL, 1, 'extent', 'Extent', 'The size or duration of the resource.'),
(26, NULL, 1, 'medium', 'Medium', 'The material or physical carrier of the resource.'),
(27, NULL, 1, 'isVersionOf', 'Is Version Of', 'A related resource of which the described resource is a version, edition, or adaptation.'),
(28, NULL, 1, 'hasVersion', 'Has Version', 'A related resource that is a version, edition, or adaptation of the described resource.'),
(29, NULL, 1, 'isReplacedBy', 'Is Replaced By', 'A related resource that supplants, displaces, or supersedes the described resource.'),
(30, NULL, 1, 'replaces', 'Replaces', 'A related resource that is supplanted, displaced, or superseded by the described resource.'),
(31, NULL, 1, 'isRequiredBy', 'Is Required By', 'A related resource that requires the described resource to support its function, delivery, or coherence.'),
(32, NULL, 1, 'requires', 'Requires', 'A related resource that is required by the described resource to support its function, delivery, or coherence.'),
(33, NULL, 1, 'isPartOf', 'Is Part Of', 'A related resource in which the described resource is physically or logically included.'),
(34, NULL, 1, 'hasPart', 'Has Part', 'A related resource that is included either physically or logically in the described resource.'),
(35, NULL, 1, 'isReferencedBy', 'Is Referenced By', 'A related resource that references, cites, or otherwise points to the described resource.'),
(36, NULL, 1, 'references', 'References', 'A related resource that is referenced, cited, or otherwise pointed to by the described resource.'),
(37, NULL, 1, 'isFormatOf', 'Is Format Of', 'A related resource that is substantially the same as the described resource, but in another format.'),
(38, NULL, 1, 'hasFormat', 'Has Format', 'A related resource that is substantially the same as the pre-existing described resource, but in another format.'),
(39, NULL, 1, 'conformsTo', 'Conforms To', 'An established standard to which the described resource conforms.'),
(40, NULL, 1, 'spatial', 'Spatial Coverage', 'Spatial characteristics of the resource.'),
(41, NULL, 1, 'temporal', 'Temporal Coverage', 'Temporal characteristics of the resource.'),
(42, NULL, 1, 'mediator', 'Mediator', 'An entity that mediates access to the resource and for whom the resource is intended or useful.'),
(43, NULL, 1, 'dateAccepted', 'Date Accepted', 'Date of acceptance of the resource.'),
(44, NULL, 1, 'dateCopyrighted', 'Date Copyrighted', 'Date of copyright.'),
(45, NULL, 1, 'dateSubmitted', 'Date Submitted', 'Date of submission of the resource.'),
(46, NULL, 1, 'educationLevel', 'Audience Education Level', 'A class of entity, defined in terms of progression through an educational or training context, for which the described resource is intended.'),
(47, NULL, 1, 'accessRights', 'Access Rights', 'Information about who can access the resource or an indication of its security status.'),
(48, NULL, 1, 'bibliographicCitation', 'Bibliographic Citation', 'A bibliographic reference for the resource.'),
(49, NULL, 1, 'license', 'License', 'A legal document giving official permission to do something with the resource.'),
(50, NULL, 1, 'rightsHolder', 'Rights Holder', 'A person or organization owning or managing rights over the resource.'),
(51, NULL, 1, 'provenance', 'Provenance', 'A statement of any changes in ownership and custody of the resource since its creation that are significant for its authenticity, integrity, and interpretation.'),
(52, NULL, 1, 'instructionalMethod', 'Instructional Method', 'A process, used to engender knowledge, attitudes and skills, that the described resource is designed to support.'),
(53, NULL, 1, 'accrualMethod', 'Accrual Method', 'The method by which items are added to a collection.'),
(54, NULL, 1, 'accrualPeriodicity', 'Accrual Periodicity', 'The frequency with which items are added to a collection.'),
(55, NULL, 1, 'accrualPolicy', 'Accrual Policy', 'The policy governing the addition of items to a collection.'),
(56, NULL, 3, 'affirmedBy', 'affirmedBy', 'A legal decision that affirms a ruling.'),
(57, NULL, 3, 'annotates', 'annotates', 'Critical or explanatory note for a Document.'),
(58, NULL, 3, 'authorList', 'list of authors', 'An ordered list of authors. Normally, this list is seen as a priority list that order authors by importance.'),
(59, NULL, 3, 'citedBy', 'cited by', 'Relates a document to another document that cites the\nfirst document.'),
(60, NULL, 3, 'cites', 'cites', 'Relates a document to another document that is cited\nby the first document as reference, comment, review, quotation or for\nanother purpose.'),
(61, NULL, 3, 'contributorList', 'list of contributors', 'An ordered list of contributors. Normally, this list is seen as a priority list that order contributors by importance.'),
(62, NULL, 3, 'court', 'court', 'A court associated with a legal document; for example, that which issues a decision.'),
(63, NULL, 3, 'degree', 'degree', 'The thesis degree.'),
(64, NULL, 3, 'director', 'director', 'A Film director.'),
(65, NULL, 3, 'distributor', 'distributor', 'Distributor of a document or a collection of documents.'),
(66, NULL, 3, 'editor', 'editor', 'A person having managerial and sometimes policy-making responsibility for the editorial part of a publishing firm or of a newspaper, magazine, or other publication.'),
(67, NULL, 3, 'editorList', 'list of editors', 'An ordered list of editors. Normally, this list is seen as a priority list that order editors by importance.'),
(68, NULL, 3, 'interviewee', 'interviewee', 'An agent that is interviewed by another agent.'),
(69, NULL, 3, 'interviewer', 'interviewer', 'An agent that interview another agent.'),
(70, NULL, 3, 'issuer', 'issuer', 'An entity responsible for issuing often informally published documents such as press releases, reports, etc.'),
(71, NULL, 3, 'organizer', 'organizer', 'The organizer of an event; includes conference organizers, but also government agencies or other bodies that are responsible for conducting hearings.'),
(72, NULL, 3, 'owner', 'owner', 'Owner of a document or a collection of documents.'),
(73, NULL, 3, 'performer', 'performer', NULL),
(74, NULL, 3, 'presentedAt', 'presented at', 'Relates a document to an event; for example, a paper to a conference.'),
(75, NULL, 3, 'presents', 'presents', 'Relates an event to associated documents; for example, conference to a paper.'),
(76, NULL, 3, 'producer', 'producer', 'Producer of a document or a collection of documents.'),
(77, NULL, 3, 'recipient', 'recipient', 'An agent that receives a communication document.'),
(78, NULL, 3, 'reproducedIn', 'reproducedIn', 'The resource in which another resource is reproduced.'),
(79, NULL, 3, 'reversedBy', 'reversedBy', 'A legal decision that reverses a ruling.'),
(80, NULL, 3, 'reviewOf', 'review of', 'Relates a review document to a reviewed thing (resource, item, etc.).'),
(81, NULL, 3, 'status', 'status', 'The publication status of (typically academic) content.'),
(82, NULL, 3, 'subsequentLegalDecision', 'subsequentLegalDecision', 'A legal decision on appeal that takes action on a case (affirming it, reversing it, etc.).'),
(83, NULL, 3, 'transcriptOf', 'transcript of', 'Relates a document to some transcribed original.'),
(84, NULL, 3, 'translationOf', 'translation of', 'Relates a translated document to the original document.'),
(85, NULL, 3, 'translator', 'translator', 'A person who translates written document from one language to another.'),
(86, NULL, 3, 'abstract', 'abstract', 'A summary of the resource.'),
(87, NULL, 3, 'argued', 'date argued', 'The date on which a legal case is argued before a court. Date is of format xsd:date'),
(88, NULL, 3, 'asin', 'asin', NULL),
(89, NULL, 3, 'chapter', 'chapter', 'An chapter number'),
(90, NULL, 3, 'coden', 'coden', NULL),
(91, NULL, 3, 'content', 'content', 'This property is for a plain-text rendering of the content of a Document. While the plain-text content of an entire document could be described by this property.'),
(92, NULL, 3, 'doi', 'doi', NULL),
(93, NULL, 3, 'eanucc13', 'eanucc13', NULL),
(94, NULL, 3, 'edition', 'edition', 'The name defining a special edition of a document. Normally its a literal value composed of a version number and words.'),
(95, NULL, 3, 'eissn', 'eissn', NULL),
(96, NULL, 3, 'gtin14', 'gtin14', NULL),
(97, NULL, 3, 'handle', 'handle', NULL),
(98, NULL, 3, 'identifier', 'identifier', NULL),
(99, NULL, 3, 'isbn', 'isbn', NULL),
(100, NULL, 3, 'isbn10', 'isbn10', NULL),
(101, NULL, 3, 'isbn13', 'isbn13', NULL),
(102, NULL, 3, 'issn', 'issn', NULL),
(103, NULL, 3, 'issue', 'issue', 'An issue number'),
(104, NULL, 3, 'lccn', 'lccn', NULL),
(105, NULL, 3, 'locator', 'locator', 'A description (often numeric) that locates an item within a containing document or collection.'),
(106, NULL, 3, 'numPages', 'number of pages', 'The number of pages contained in a document'),
(107, NULL, 3, 'numVolumes', 'number of volumes', 'The number of volumes contained in a collection of documents (usually a series, periodical, etc.).'),
(108, NULL, 3, 'number', 'number', 'A generic item or document number. Not to be confused with issue number.'),
(109, NULL, 3, 'oclcnum', 'oclcnum', NULL),
(110, NULL, 3, 'pageEnd', 'page end', 'Ending page number within a continuous page range.'),
(111, NULL, 3, 'pageStart', 'page start', 'Starting page number within a continuous page range.'),
(112, NULL, 3, 'pages', 'pages', 'A string of non-contiguous page spans that locate a Document within a Collection. Example: 23-25, 34, 54-56. For continuous page ranges, use the pageStart and pageEnd properties.'),
(113, NULL, 3, 'pmid', 'pmid', NULL),
(114, NULL, 3, 'prefixName', 'prefix name', 'The prefix of a name'),
(115, NULL, 3, 'section', 'section', 'A section number'),
(116, NULL, 3, 'shortDescription', 'shortDescription', NULL),
(117, NULL, 3, 'shortTitle', 'short title', 'The abbreviation of a title.'),
(118, NULL, 3, 'sici', 'sici', NULL),
(119, NULL, 3, 'suffixName', 'suffix name', 'The suffix of a name'),
(120, NULL, 3, 'upc', 'upc', NULL),
(121, NULL, 3, 'uri', 'uri', 'Universal Resource Identifier of a document'),
(122, NULL, 3, 'volume', 'volume', 'A volume number'),
(123, NULL, 4, 'mbox', 'personal mailbox', 'A  personal mailbox, ie. an Internet mailbox associated with exactly one owner, the first owner of this mailbox. This is a \'static inverse functional property\', in that  there is (across time and change) at most one individual that ever has any particular value for foaf:mbox.'),
(124, NULL, 4, 'mbox_sha1sum', 'sha1sum of a personal mailbox URI name', 'The sha1sum of the URI of an Internet mailbox associated with exactly one owner, the  first owner of the mailbox.'),
(125, NULL, 4, 'gender', 'gender', 'The gender of this Agent (typically but not necessarily \'male\' or \'female\').'),
(126, NULL, 4, 'geekcode', 'geekcode', 'A textual geekcode for this person, see http://www.geekcode.com/geek.html'),
(127, NULL, 4, 'dnaChecksum', 'DNA checksum', 'A checksum for the DNA of some thing. Joke.'),
(128, NULL, 4, 'sha1', 'sha1sum (hex)', 'A sha1sum hash, in hex.'),
(129, NULL, 4, 'based_near', 'based near', 'A location that something is based near, for some broadly human notion of near.'),
(130, NULL, 4, 'title', 'title', 'Title (Mr, Mrs, Ms, Dr. etc)'),
(131, NULL, 4, 'nick', 'nickname', 'A short informal nickname characterising an agent (includes login identifiers, IRC and other chat nicknames).'),
(132, NULL, 4, 'jabberID', 'jabber ID', 'A jabber ID for something.'),
(133, NULL, 4, 'aimChatID', 'AIM chat ID', 'An AIM chat ID'),
(134, NULL, 4, 'skypeID', 'Skype ID', 'A Skype ID'),
(135, NULL, 4, 'icqChatID', 'ICQ chat ID', 'An ICQ chat ID'),
(136, NULL, 4, 'yahooChatID', 'Yahoo chat ID', 'A Yahoo chat ID'),
(137, NULL, 4, 'msnChatID', 'MSN chat ID', 'An MSN chat ID'),
(138, NULL, 4, 'name', 'name', 'A name for some thing.'),
(139, NULL, 4, 'firstName', 'firstName', 'The first name of a person.'),
(140, NULL, 4, 'lastName', 'lastName', 'The last name of a person.'),
(141, NULL, 4, 'givenName', 'Given name', 'The given name of some person.'),
(142, NULL, 4, 'givenname', 'Given name', 'The given name of some person.'),
(143, NULL, 4, 'surname', 'Surname', 'The surname of some person.'),
(144, NULL, 4, 'family_name', 'family_name', 'The family name of some person.'),
(145, NULL, 4, 'familyName', 'familyName', 'The family name of some person.'),
(146, NULL, 4, 'phone', 'phone', 'A phone,  specified using fully qualified tel: URI scheme (refs: http://www.w3.org/Addressing/schemes.html#tel).'),
(147, NULL, 4, 'homepage', 'homepage', 'A homepage for some thing.'),
(148, NULL, 4, 'weblog', 'weblog', 'A weblog of some thing (whether person, group, company etc.).'),
(149, NULL, 4, 'openid', 'openid', 'An OpenID for an Agent.'),
(150, NULL, 4, 'tipjar', 'tipjar', 'A tipjar document for this agent, describing means for payment and reward.'),
(151, NULL, 4, 'plan', 'plan', 'A .plan comment, in the tradition of finger and \'.plan\' files.'),
(152, NULL, 4, 'made', 'made', 'Something that was made by this agent.'),
(153, NULL, 4, 'maker', 'maker', 'An agent that  made this thing.'),
(154, NULL, 4, 'img', 'image', 'An image that can be used to represent some thing (ie. those depictions which are particularly representative of something, eg. one\'s photo on a homepage).'),
(155, NULL, 4, 'depiction', 'depiction', 'A depiction of some thing.'),
(156, NULL, 4, 'depicts', 'depicts', 'A thing depicted in this representation.'),
(157, NULL, 4, 'thumbnail', 'thumbnail', 'A derived thumbnail image.'),
(158, NULL, 4, 'myersBriggs', 'myersBriggs', 'A Myers Briggs (MBTI) personality classification.'),
(159, NULL, 4, 'workplaceHomepage', 'workplace homepage', 'A workplace homepage of some person; the homepage of an organization they work for.'),
(160, NULL, 4, 'workInfoHomepage', 'work info homepage', 'A work info homepage of some person; a page about their work for some organization.'),
(161, NULL, 4, 'schoolHomepage', 'schoolHomepage', 'A homepage of a school attended by the person.'),
(162, NULL, 4, 'knows', 'knows', 'A person known by this person (indicating some level of reciprocated interaction between the parties).'),
(163, NULL, 4, 'interest', 'interest', 'A page about a topic of interest to this person.'),
(164, NULL, 4, 'topic_interest', 'topic_interest', 'A thing of interest to this person.'),
(165, NULL, 4, 'publications', 'publications', 'A link to the publications of this person.'),
(166, NULL, 4, 'currentProject', 'current project', 'A current project this person works on.'),
(167, NULL, 4, 'pastProject', 'past project', 'A project this person has previously worked on.'),
(168, NULL, 4, 'fundedBy', 'funded by', 'An organization funding a project or person.'),
(169, NULL, 4, 'logo', 'logo', 'A logo representing some thing.'),
(170, NULL, 4, 'topic', 'topic', 'A topic of some page or document.'),
(171, NULL, 4, 'primaryTopic', 'primary topic', 'The primary topic of some page or document.'),
(172, NULL, 4, 'focus', 'focus', 'The underlying or \'focal\' entity associated with some SKOS-described concept.'),
(173, NULL, 4, 'isPrimaryTopicOf', 'is primary topic of', 'A document that this thing is the primary topic of.'),
(174, NULL, 4, 'page', 'page', 'A page or document about this thing.'),
(175, NULL, 4, 'theme', 'theme', 'A theme.'),
(176, NULL, 4, 'account', 'account', 'Indicates an account held by this agent.'),
(177, NULL, 4, 'holdsAccount', 'account', 'Indicates an account held by this agent.'),
(178, NULL, 4, 'accountServiceHomepage', 'account service homepage', 'Indicates a homepage of the service provide for this online account.'),
(179, NULL, 4, 'accountName', 'account name', 'Indicates the name (identifier) associated with this online account.'),
(180, NULL, 4, 'member', 'member', 'Indicates a member of a Group'),
(181, NULL, 4, 'membershipClass', 'membershipClass', 'Indicates the class of individuals that are a member of a Group'),
(182, NULL, 4, 'birthday', 'birthday', 'The birthday of this Agent, represented in mm-dd string form, eg. \'12-31\'.'),
(183, NULL, 4, 'age', 'age', 'The age in years of some agent.'),
(184, NULL, 4, 'status', 'status', 'A string expressing what the user is happy for the general public (normally) to know about their current activity.'),
(185, NULL, 5, 'x', 'x', NULL),
(186, NULL, 5, 'y', 'y', NULL),
(187, NULL, 5, 'xRatingValue', 'xRatingValue', NULL),
(188, NULL, 5, 'yRatingValue', 'yRatingValue', NULL),
(189, NULL, 5, 'degradName', 'degradName', NULL),
(190, NULL, 5, 'degradColors', 'degradColors', NULL),
(191, NULL, 5, 'creationDate', 'creationDate', NULL),
(192, NULL, 5, 'hasExistence', 'a comme existence', NULL),
(193, NULL, 5, 'hasActant', 'a comme actant', NULL),
(194, NULL, 5, 'hasPhysique', 'a comme physique', NULL),
(195, NULL, 5, 'hasConcept', 'a comme concept', NULL),
(196, NULL, 5, 'hasRapport', 'a comme rapport', NULL),
(197, NULL, 5, 'hasCrible', 'a comme crible', NULL),
(198, NULL, 5, 'cribleLabel', 'cribleLabel', NULL),
(199, NULL, 5, 'cribleId', 'cribleId', NULL),
(200, NULL, 5, 'cribleRatingValue', 'cribleRatingValue', NULL),
(201, NULL, 5, 'distanceCenter', 'distance du centre', NULL),
(202, NULL, 5, 'distanceConcept', 'distance du concept', NULL),
(203, NULL, 5, 'ordreCrible', 'Ordre dans le crible', NULL),
(204, NULL, 5, 'hasCribleCarto', 'a comme cartographie', NULL),
(205, NULL, 5, 'hasSujet', 'a comme sujet', NULL),
(206, NULL, 5, 'hasObjet', 'a comme objet', NULL),
(207, NULL, 5, 'hasPredicat', 'a comme prédicat', NULL),
(208, NULL, 5, 'hasMenu', 'a comme menu', NULL),
(209, NULL, 5, 'hasArchetype', 'a comme archetype', NULL),
(210, NULL, 6, 'inScheme', 'is in scheme', NULL),
(211, NULL, 6, 'hasTopConcept', 'has top concept', NULL),
(212, NULL, 6, 'topConceptOf', 'is top concept in scheme', NULL),
(213, NULL, 6, 'altLabel', 'alternative label', 'The range of skos:altLabel is the class of RDF plain literals.'),
(214, NULL, 6, 'hiddenLabel', 'hidden label', 'The range of skos:hiddenLabel is the class of RDF plain literals.'),
(215, NULL, 6, 'notation', 'notation', NULL),
(216, NULL, 6, 'note', 'note', NULL),
(217, NULL, 6, 'changeNote', 'change note', NULL),
(218, NULL, 6, 'definition', 'definition', NULL),
(219, NULL, 6, 'editorialNote', 'editorial note', NULL),
(220, NULL, 6, 'example', 'example', NULL),
(221, NULL, 6, 'historyNote', 'history note', NULL),
(222, NULL, 6, 'scopeNote', 'scope note', NULL),
(223, NULL, 6, 'semanticRelation', 'is in semantic relation with', NULL),
(224, NULL, 6, 'broader', 'has broader', 'Broader concepts are typically rendered as parents in a concept hierarchy (tree).'),
(225, NULL, 6, 'narrower', 'has narrower', 'Narrower concepts are typically rendered as children in a concept hierarchy (tree).'),
(226, NULL, 6, 'related', 'has related', 'skos:related is disjoint with skos:broaderTransitive'),
(227, NULL, 6, 'broaderTransitive', 'has broader transitive', NULL),
(228, NULL, 6, 'narrowerTransitive', 'has narrower transitive', NULL),
(229, NULL, 6, 'member', 'has member', NULL),
(230, NULL, 6, 'memberList', 'has member list', 'For any resource, every item in the list given as the value of the\n      skos:memberList property is also a value of the skos:member property.'),
(231, NULL, 6, 'mappingRelation', 'is in mapping relation with', 'These concept mapping relations mirror semantic relations, and the data model defined below is similar (with the exception of skos:exactMatch) to the data model defined for semantic relations. A distinct vocabulary is provided for concept mapping relations, to provide a convenient way to differentiate links within a concept scheme from links between concept schemes. However, this pattern of usage is not a formal requirement of the SKOS data model, and relies on informal definitions of best practice.'),
(232, NULL, 6, 'broadMatch', 'has broader match', NULL),
(233, NULL, 6, 'narrowMatch', 'has narrower match', NULL),
(234, NULL, 6, 'relatedMatch', 'has related match', NULL),
(235, NULL, 6, 'exactMatch', 'has exact match', 'skos:exactMatch is disjoint with each of the properties skos:broadMatch and skos:relatedMatch.'),
(236, NULL, 6, 'closeMatch', 'has close match', NULL),
(237, NULL, 7, 'access', 'Access', 'Define an access to the resource.'),
(238, NULL, 7, 'featured', 'Featured', 'Mark the resource as a featured one as soon as a value is set, whatever it is.'),
(239, NULL, 7, 'new', 'New', 'Mark the resource as a new one as soon as a value is set, whatever it is.'),
(240, NULL, 7, 'reserved', 'Reserved', 'Define the resource as a restricted access one as soon a value is set, whatever it is.'),
(241, NULL, 7, 'selected', 'Selected', 'Mark the resource as a selected one as soon as a value is set, whatever it is.'),
(242, NULL, 7, 'category', 'Category', 'A topic that can be used for some purposes.'),
(243, NULL, 7, 'collection', 'Collection', 'A way to group resources.'),
(244, NULL, 7, 'set', 'Set', 'A set to group resources together.'),
(245, NULL, 7, 'subject', 'Subject', 'A subject to describe the resource.'),
(246, NULL, 7, 'tag', 'Tag', 'Tag that can be used for some purposes or for upgrade from Omeka Classic.'),
(247, NULL, 7, 'theme', 'Theme', 'A domain that can be used for some purposes.'),
(248, NULL, 7, 'type', 'Type', 'A type that can be used for some purposes.'),
(249, NULL, 7, 'coordinates', 'Coordinates', 'Numerical coordinates related to the resource, generaly the geographic position.'),
(250, NULL, 7, 'data', 'Data', 'Any data that can be used for any purpose.'),
(251, NULL, 7, 'dateStart', 'Date of start', 'Start date related to the resource, for example an embargo.'),
(252, NULL, 7, 'dateEnd', 'Date of end', 'End date related to the resource, for example an embargo.'),
(253, NULL, 7, 'location', 'Location', 'A location related to the resource, for example the place of publication.'),
(254, NULL, 7, 'note', 'Note', 'A specific or generic information on a resource, generally for internal purposes.'),
(255, NULL, 7, 'number', 'Number', 'A number related to the resource.'),
(256, NULL, 7, 'rank', 'Rank', 'A rank or a position related to the resource.'),
(257, NULL, 7, 'status', 'Status', 'The status of the resource, generally for internal purposes.'),
(258, NULL, 8, 'annotationService', 'annotation service', 'The object of the relationship is the end point of a service that conforms to the annotation-protocol, and it may be associated with any resource.  The expectation of asserting the relationship is that the object is the preferred service for maintaining annotations about the subject resource, according to the publisher of the relationship.\n\n  This relationship is intended to be used both within Linked Data descriptions and as the  rel  type of a Link, via HTTP Link Headers rfc5988 for binary resources and in HTML <link> elements.  For more information about these, please see the Annotation Protocol specification annotation-protocol.\n  '),
(259, NULL, 8, 'bodyValue', 'body value', 'The object of the predicate is a plain text string to be used as the content of the body of the Annotation.  The value MUST be an  xsd:string  and that data type MUST NOT be expressed in the serialization. Note that language MUST NOT be associated with the value either as a language tag, as that is only available for  rdf:langString .\n  '),
(260, NULL, 8, 'cachedSource', 'cached source', 'A object of the relationship is a copy of the Source resource\'s representation, appropriate for the Annotation.'),
(261, NULL, 8, 'canonical', 'canonical', 'A object of the relationship is the canonical IRI that can always be used to deduplicate the Annotation, regardless of the current IRI used to access the representation.'),
(262, NULL, 8, 'end', 'end', 'The end property is used to convey the 0-based index of the end position of a range of content.'),
(263, NULL, 8, 'exact', 'exact', 'The object of the predicate is a copy of the text which is being selected, after normalization.'),
(264, NULL, 8, 'hasBody', 'has body', 'The object of the relationship is a resource that is a body of the Annotation.'),
(265, NULL, 8, 'hasEndSelector', 'has end selector', 'The relationship between a RangeSelector and the Selector that describes the end position of the range. '),
(266, NULL, 8, 'hasPurpose', 'has purpose', 'The purpose served by the resource in the Annotation.'),
(267, NULL, 8, 'hasScope', 'has scope', 'The scope or context in which the resource is used within the Annotation.'),
(268, NULL, 8, 'hasSelector', 'has selector', 'The object of the relationship is a Selector that describes the segment or region of interest within the source resource.  Please note that the domain ( oa:ResourceSelection ) is not used directly in the Web Annotation model.'),
(269, NULL, 8, 'hasSource', 'has source', 'The resource that the ResourceSelection, or its subclass SpecificResource, is refined from, or more specific than. Please note that the domain ( oa:ResourceSelection ) is not used directly in the Web Annotation model.'),
(270, NULL, 8, 'hasStartSelector', 'has start selector', 'The relationship between a RangeSelector and the Selector that describes the start position of the range. '),
(271, NULL, 8, 'hasState', 'has state', 'The relationship between the ResourceSelection, or its subclass SpecificResource, and a State resource. Please note that the domain ( oa:ResourceSelection ) is not used directly in the Web Annotation model.'),
(272, NULL, 8, 'hasTarget', 'has target', 'The relationship between an Annotation and its Target.'),
(273, NULL, 8, 'motivatedBy', 'motivated by', 'The relationship between an Annotation and a Motivation that describes the reason for the Annotation\'s creation.'),
(274, NULL, 8, 'prefix', 'prefix', 'The object of the property is a snippet of content that occurs immediately before the content which is being selected by the Selector.'),
(275, NULL, 8, 'processingLanguage', 'processing language', 'The object of the property is the language that should be used for textual processing algorithms when dealing with the content of the resource, including hyphenation, line breaking, which font to use for rendering and so forth.  The value must follow the recommendations of BCP47.'),
(276, NULL, 8, 'refinedBy', 'refined by', 'The relationship between a Selector and another Selector or a State and a Selector or State that should be applied to the results of the first to refine the processing of the source resource. '),
(277, NULL, 8, 'renderedVia', 'rendered via', 'A system that was used by the application that created the Annotation to render the resource.'),
(278, NULL, 8, 'sourceDate', 'source date', 'The timestamp at which the Source resource should be interpreted as being applicable to the Annotation.'),
(279, NULL, 8, 'sourceDateEnd', 'source date end', 'The end timestamp of the interval over which the Source resource should be interpreted as being applicable to the Annotation.'),
(280, NULL, 8, 'sourceDateStart', 'source date start', 'The start timestamp of the interval over which the Source resource should be interpreted as being applicable to the Annotation.'),
(281, NULL, 8, 'start', 'start', 'The start position in a 0-based index at which a range of content is selected from the data in the source resource.'),
(282, NULL, 8, 'styleClass', 'style class', 'The name of the class used in the CSS description referenced from the Annotation that should be applied to the Specific Resource.'),
(283, NULL, 8, 'styledBy', 'styled by', 'A reference to a Stylesheet that should be used to apply styles to the Annotation rendering.'),
(284, NULL, 8, 'suffix', 'suffix', 'The snippet of text that occurs immediately after the text which is being selected.'),
(285, NULL, 8, 'textDirection', 'text direction', 'The direction of the text of the subject resource. There MUST only be one text direction associated with any given resource.'),
(286, NULL, 8, 'via', 'via', 'A object of the relationship is a resource from which the source resource was retrieved by the providing system.'),
(287, NULL, 9, 'type', 'type', 'The subject is an instance of a class.'),
(288, NULL, 9, 'subject', 'subject', 'The subject of the subject RDF statement.'),
(289, NULL, 9, 'predicate', 'predicate', 'The predicate of the subject RDF statement.'),
(290, NULL, 9, 'object', 'object', 'The object of the subject RDF statement.'),
(291, NULL, 9, 'value', 'value', 'Idiomatic property used for structured values.'),
(292, NULL, 9, 'first', 'first', 'The first item in the subject RDF list.'),
(293, NULL, 9, 'rest', 'rest', 'The rest of the subject RDF list after the first item.');

-- --------------------------------------------------------

--
-- Structure de la table `resource`
--

CREATE TABLE `resource` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `resource_class_id` int(11) DEFAULT NULL,
  `resource_template_id` int(11) DEFAULT NULL,
  `thumbnail_id` int(11) DEFAULT NULL,
  `title` longtext DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL,
  `created` datetime NOT NULL,
  `modified` datetime DEFAULT NULL,
  `resource_type` varchar(190) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `resource`
--

INSERT INTO `resource` (`id`, `owner_id`, `resource_class_id`, `resource_template_id`, `thumbnail_id`, `title`, `is_public`, `created`, `modified`, `resource_type`) VALUES
(1998, 3, 46, NULL, NULL, 'Activités de recherche', 1, '2026-10-05 14:37:09', '2026-10-05 14:37:09', 'Omeka\\Entity\\Item'),
(2013, 3, 13, NULL, NULL, 'Configuration chaoticum-seminario – 2026-10-14T13:52:47.747Z', 1, '2026-10-14 13:52:48', '2026-10-14 13:53:51', 'Omeka\\Entity\\Item'),
(2014, 3, NULL, NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:52', '2026-10-14 13:53:52', 'Omeka\\Entity\\Media'),
(2015, 3, NULL, NULL, NULL, 'Rapport de la partition – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:52', '2026-10-14 13:53:52', 'Omeka\\Entity\\Media'),
(2016, 3, NULL, NULL, NULL, 'Diapo AAQ_2021 27 (écran 2) – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:52', '2026-10-14 13:53:52', 'Omeka\\Entity\\Media'),
(2017, 3, NULL, NULL, NULL, 'Diapo tdcw25 12 (écran 7) – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:53', '2026-10-14 13:53:53', 'Omeka\\Entity\\Media'),
(2018, 3, NULL, NULL, NULL, 'Diapo ValPedArNum 13 (écran 12) – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:53', '2026-10-14 13:53:53', 'Omeka\\Entity\\Media'),
(2019, 3, NULL, NULL, NULL, 'Diapo HDR 22 (écran 17) – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:54', '2026-10-14 13:53:54', 'Omeka\\Entity\\Media'),
(2020, 3, NULL, NULL, NULL, 'Diapo ia-iv-humain-2026 2 (écran 22) – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:54', '2026-10-14 13:53:54', 'Omeka\\Entity\\Media'),
(2021, 3, NULL, NULL, NULL, 'Diapo repyramidage 4 (écran 27) – 2026-10-14T13:53:51.864Z', 1, '2026-10-14 13:53:55', '2026-10-14 13:53:55', 'Omeka\\Entity\\Media'),
(2022, 3, 75, NULL, NULL, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 14/10/2026 15:55:28', 1, '2026-10-14 13:57:48', '2026-10-14 13:57:48', 'Omeka\\Entity\\Item'),
(2023, 3, NULL, NULL, NULL, 'Participation 2026-10-14T13-57-46-873Z-5c18c3', 1, '2026-10-14 13:57:48', '2026-10-14 13:57:48', 'Omeka\\Entity\\Media'),
(2024, 3, 75, NULL, NULL, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:19:53', 1, '2026-10-17 06:22:34', '2026-10-17 06:22:34', 'Omeka\\Entity\\Item'),
(2025, 3, NULL, NULL, NULL, 'Participation 2026-10-17T06-22-33-415Z-8523f5', 1, '2026-10-17 06:22:35', '2026-10-17 06:22:35', 'Omeka\\Entity\\Media'),
(2026, 3, 75, NULL, NULL, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:24:07', 1, '2026-10-17 06:27:27', '2026-10-17 06:27:27', 'Omeka\\Entity\\Item'),
(2027, 3, NULL, NULL, NULL, 'Participation 2026-10-17T06-27-26-080Z-65af31', 1, '2026-10-17 06:27:28', '2026-10-17 06:27:28', 'Omeka\\Entity\\Media'),
(2028, 3, 13, NULL, NULL, 'Configuration chaoticum-seminario – 2026-10-24T05:14:17.337Z', 1, '2026-10-24 05:14:17', '2026-10-24 05:15:11', 'Omeka\\Entity\\Item'),
(2029, 3, NULL, NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:11', '2026-10-24 05:15:11', 'Omeka\\Entity\\Media'),
(2030, 3, NULL, NULL, NULL, 'Rapport de la partition – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:12', '2026-10-24 05:15:12', 'Omeka\\Entity\\Media'),
(2031, 3, NULL, NULL, NULL, 'Diapo seminaireEHESS_2015 9 (écran 2) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:12', '2026-10-24 05:15:12', 'Omeka\\Entity\\Media'),
(2032, 3, NULL, NULL, NULL, 'Diapo software_digital-humanitiesII 14 (écran 6) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:13', '2026-10-24 05:15:13', 'Omeka\\Entity\\Media'),
(2033, 3, NULL, NULL, NULL, 'Diapo iskoMagreb_2015 18 (écran 10) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:13', '2026-10-24 05:15:13', 'Omeka\\Entity\\Media'),
(2034, 3, NULL, NULL, NULL, 'Diapo seminaireEHESS_2015 11 (écran 14) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:14', '2026-10-24 05:15:14', 'Omeka\\Entity\\Media'),
(2035, 3, NULL, NULL, NULL, 'Diapo je-creationParis8 26 (écran 18) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:14', '2026-10-24 05:15:14', 'Omeka\\Entity\\Media'),
(2036, 3, NULL, NULL, NULL, 'Diapo seminaireEHESS_2015 22 (écran 22) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:15', '2026-10-24 05:15:15', 'Omeka\\Entity\\Media'),
(2037, 3, NULL, NULL, NULL, 'Diapo patrimoine 7 (écran 26) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:15', '2026-10-24 05:15:15', 'Omeka\\Entity\\Media'),
(2038, 3, NULL, NULL, NULL, 'Diapo seminaireEHESS_2015 7 (écran 30) – 2026-10-24T05:15:11.300Z', 1, '2026-10-24 05:15:16', '2026-10-24 05:15:16', 'Omeka\\Entity\\Media'),
(2039, 3, 75, NULL, NULL, 'Participation – Jean-Pierre Balpe, (méta-)auteur : l’écriture infinie   – 24/10/2026 07:16:19', 1, '2026-10-24 05:28:07', '2026-10-24 05:28:07', 'Omeka\\Entity\\Item'),
(2040, 3, NULL, NULL, NULL, 'Participation 2026-10-24T05-28-06-155Z-4fc2e2', 1, '2026-10-24 05:28:08', '2026-10-24 05:28:08', 'Omeka\\Entity\\Media'),
(2041, 3, 13, NULL, NULL, 'Configuration chaoticum-seminario – 2026-10-27T14:24:20.868Z', 1, '2026-10-27 14:24:21', '2026-10-27 14:26:38', 'Omeka\\Entity\\Item'),
(2042, 3, NULL, NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:38', '2026-10-27 14:26:38', 'Omeka\\Entity\\Media'),
(2043, 3, NULL, NULL, NULL, 'Rapport de la partition – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:38', '2026-10-27 14:26:38', 'Omeka\\Entity\\Media'),
(2044, 3, NULL, NULL, NULL, 'Diapo ValPedArNum 15 (écran 2) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:39', '2026-10-27 14:26:39', 'Omeka\\Entity\\Media'),
(2045, 3, NULL, NULL, NULL, 'Diapo iotLabs_2018 2 (écran 6) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:39', '2026-10-27 14:26:39', 'Omeka\\Entity\\Media'),
(2046, 3, NULL, NULL, NULL, 'Diapo ia-iv-humain-2026 2 (écran 10) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:40', '2026-10-27 14:26:40', 'Omeka\\Entity\\Media'),
(2047, 3, NULL, NULL, NULL, 'Diapo 01Design8 19 (écran 14) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:40', '2026-10-27 14:26:40', 'Omeka\\Entity\\Media'),
(2048, 3, NULL, NULL, NULL, 'Diapo NDIDO2017 17 (écran 18) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:41', '2026-10-27 14:26:41', 'Omeka\\Entity\\Media'),
(2049, 3, NULL, NULL, NULL, 'Diapo PEPE_2019 14 (écran 22) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:41', '2026-10-27 14:26:41', 'Omeka\\Entity\\Media'),
(2050, 3, NULL, NULL, NULL, 'Diapo seminaireEHESS_2015 25 (écran 26) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:42', '2026-10-27 14:26:42', 'Omeka\\Entity\\Media'),
(2051, 3, NULL, NULL, NULL, 'Diapo sqet_2019 21 (écran 30) – 2026-10-27T14:26:38.245Z', 1, '2026-10-27 14:26:42', '2026-10-27 14:26:42', 'Omeka\\Entity\\Media'),
(2052, 3, 13, NULL, NULL, 'Configuration chaoticum-seminario – 2026-11-02T15:38:20.002Z', 1, '2026-11-02 15:38:20', '2026-11-02 15:39:38', 'Omeka\\Entity\\Item'),
(2053, 3, NULL, NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:39', '2026-11-02 15:39:39', 'Omeka\\Entity\\Media'),
(2054, 3, NULL, NULL, NULL, 'Rapport de la partition – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:39', '2026-11-02 15:39:39', 'Omeka\\Entity\\Media'),
(2055, 3, NULL, NULL, NULL, 'Diapo ValPedArNum 15 (écran 2) – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:39', '2026-11-02 15:39:39', 'Omeka\\Entity\\Media'),
(2056, 3, NULL, NULL, NULL, 'Diapo HumanAtHome 3 (écran 7) – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:40', '2026-11-02 15:39:40', 'Omeka\\Entity\\Media'),
(2057, 3, NULL, NULL, NULL, 'Diapo software_digital-humanitiesII 16 (écran 12) – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:40', '2026-11-02 15:39:40', 'Omeka\\Entity\\Media'),
(2058, 3, NULL, NULL, NULL, 'Diapo hyperurbain5 7 (écran 17) – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:41', '2026-11-02 15:39:41', 'Omeka\\Entity\\Media'),
(2059, 3, NULL, NULL, NULL, 'Diapo software_digital-humanitiesII 25 (écran 22) – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:42', '2026-11-02 15:39:42', 'Omeka\\Entity\\Media'),
(2060, 3, NULL, NULL, NULL, 'Diapo sqet_2019 17 (écran 27) – 2026-11-02T15:39:38.915Z', 1, '2026-11-02 15:39:42', '2026-11-02 15:39:42', 'Omeka\\Entity\\Media'),
(2061, 3, 13, NULL, NULL, 'Configuration chaoticum-seminario – 2026-11-20T05:52:09.552Z', 1, '2026-11-20 05:52:09', '2026-11-20 05:54:53', 'Omeka\\Entity\\Item'),
(2063, 3, NULL, NULL, NULL, 'Rapport de la partition – 2026-11-20T05:54:53.641Z', 1, '2026-11-20 05:54:54', '2026-11-20 05:54:54', 'Omeka\\Entity\\Media'),
(2064, 3, NULL, NULL, NULL, 'Diapo je-creationParis8 1 (écran 2) – 2026-11-20T05:54:53.641Z', 1, '2026-11-20 05:54:54', '2026-11-20 05:54:54', 'Omeka\\Entity\\Media'),
(2065, 3, NULL, NULL, NULL, 'Diapo software_digital-humanitiesII 3 (écran 7) – 2026-11-20T05:54:53.641Z', 1, '2026-11-20 05:54:55', '2026-11-20 05:54:55', 'Omeka\\Entity\\Media'),
(2066, 3, NULL, NULL, NULL, 'Diapo je-creationParis8 8 (écran 12) – 2026-11-20T05:54:53.641Z', 1, '2026-11-20 05:54:55', '2026-11-20 05:54:55', 'Omeka\\Entity\\Media'),
(2067, 3, NULL, NULL, NULL, 'Diapo MIND_2020 1 (écran 17) – 2026-11-20T05:54:53.641Z', 1, '2026-11-20 05:54:56', '2026-11-20 05:54:56', 'Omeka\\Entity\\Media'),
(2068, 3, NULL, NULL, NULL, 'Diapo software_digital-humanitiesII 32 (écran 22) – 2026-11-20T05:54:53.641Z', 1, '2026-11-20 05:54:56', '2026-11-20 05:54:56', 'Omeka\\Entity\\Media'),
(2069, 3, NULL, NULL, NULL, 'Diapo repyramidage 9 (écran 27) – 2026-11-20T05:54:53.641Z', 1, '2026-11-20 05:54:57', '2026-11-20 05:54:57', 'Omeka\\Entity\\Media'),
(2072, 3, NULL, NULL, NULL, 'Copie d\'écran diapo_emwol28ka.png (éditeur)', 1, '2026-11-20 06:13:31', '2026-11-20 06:13:31', 'Omeka\\Entity\\Media'),
(2075, 3, NULL, NULL, NULL, 'Copie d\'écran diapo_emwol8o9k.png (éditeur)', 1, '2026-11-20 06:18:32', '2026-11-20 06:18:32', 'Omeka\\Entity\\Media'),
(2078, 3, NULL, NULL, NULL, 'Copie d\'écran diapo_emwolev3w.png (éditeur)', 1, '2026-11-20 06:23:21', '2026-11-20 06:23:21', 'Omeka\\Entity\\Media'),
(2082, 3, NULL, NULL, NULL, 'Copie d\'écran diapo_emwolprtx.png (éditeur)', 1, '2026-11-20 06:31:50', '2026-11-20 06:31:50', 'Omeka\\Entity\\Media'),
(2085, 3, NULL, NULL, NULL, 'Copie d\'écran diapo_emwolrudh.png (éditeur)', 1, '2026-11-20 06:33:26', '2026-11-20 06:33:26', 'Omeka\\Entity\\Media'),
(2087, 3, NULL, NULL, NULL, 'Copie d\'écran diapo_emwolxnsc.png (éditeur)', 1, '2026-11-20 06:37:58', '2026-11-20 06:37:58', 'Omeka\\Entity\\Media'),
(2092, 3, NULL, NULL, NULL, 'Copie d\'écran diapo_emwomy1e2.png (éditeur)', 1, '2026-11-20 07:06:15', '2026-11-20 07:06:15', 'Omeka\\Entity\\Media'),
(2121, 3, NULL, NULL, NULL, 'Partition chaoticumSeminario (données) – modifiée le 2026-11-20T09:13:07.120Z', 1, '2026-11-20 09:13:08', '2026-11-20 09:13:08', 'Omeka\\Entity\\Media'),
(2122, 3, 75, NULL, NULL, 'Participation – Université Paris 8 Formation IA 2026 - 2027 – 20/11/2026 06:58:25', 1, '2026-11-20 09:19:21', '2026-11-20 09:19:21', 'Omeka\\Entity\\Item'),
(2123, 3, NULL, NULL, NULL, 'Participation 2026-11-20T09-19-19-804Z-52aa24', 1, '2026-11-20 09:19:21', '2026-11-20 09:19:21', 'Omeka\\Entity\\Media');

-- --------------------------------------------------------

--
-- Structure de la table `resource_class`
--

CREATE TABLE `resource_class` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `vocabulary_id` int(11) NOT NULL,
  `local_name` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `label` varchar(255) NOT NULL,
  `comment` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `resource_class`
--

INSERT INTO `resource_class` (`id`, `owner_id`, `vocabulary_id`, `local_name`, `label`, `comment`) VALUES
(1, NULL, 1, 'Agent', 'Agent', 'A resource that acts or has the power to act.'),
(2, NULL, 1, 'AgentClass', 'Agent Class', 'A group of agents.'),
(3, NULL, 1, 'BibliographicResource', 'Bibliographic Resource', 'A book, article, or other documentary resource.'),
(4, NULL, 1, 'FileFormat', 'File Format', 'A digital resource format.'),
(5, NULL, 1, 'Frequency', 'Frequency', 'A rate at which something recurs.'),
(6, NULL, 1, 'Jurisdiction', 'Jurisdiction', 'The extent or range of judicial, law enforcement, or other authority.'),
(7, NULL, 1, 'LicenseDocument', 'License Document', 'A legal document giving official permission to do something with a Resource.'),
(8, NULL, 1, 'LinguisticSystem', 'Linguistic System', 'A system of signs, symbols, sounds, gestures, or rules used in communication.'),
(9, NULL, 1, 'Location', 'Location', 'A spatial region or named place.'),
(10, NULL, 1, 'LocationPeriodOrJurisdiction', 'Location, Period, or Jurisdiction', 'A location, period of time, or jurisdiction.'),
(11, NULL, 1, 'MediaType', 'Media Type', 'A file format or physical medium.'),
(12, NULL, 1, 'MediaTypeOrExtent', 'Media Type or Extent', 'A media type or extent.'),
(13, NULL, 1, 'MethodOfInstruction', 'Method of Instruction', 'A process that is used to engender knowledge, attitudes, and skills.'),
(14, NULL, 1, 'MethodOfAccrual', 'Method of Accrual', 'A method by which resources are added to a collection.'),
(15, NULL, 1, 'PeriodOfTime', 'Period of Time', 'An interval of time that is named or defined by its start and end dates.'),
(16, NULL, 1, 'PhysicalMedium', 'Physical Medium', 'A physical material or carrier.'),
(17, NULL, 1, 'PhysicalResource', 'Physical Resource', 'A material thing.'),
(18, NULL, 1, 'Policy', 'Policy', 'A plan or course of action by an authority, intended to influence and determine decisions, actions, and other matters.'),
(19, NULL, 1, 'ProvenanceStatement', 'Provenance Statement', 'A statement of any changes in ownership and custody of a resource since its creation that are significant for its authenticity, integrity, and interpretation.'),
(20, NULL, 1, 'RightsStatement', 'Rights Statement', 'A statement about the intellectual property rights (IPR) held in or over a Resource, a legal document giving official permission to do something with a resource, or a statement about access rights.'),
(21, NULL, 1, 'SizeOrDuration', 'Size or Duration', 'A dimension or extent, or a time taken to play or execute.'),
(22, NULL, 1, 'Standard', 'Standard', 'A basis for comparison; a reference point against which other things can be evaluated.'),
(23, NULL, 2, 'Collection', 'Collection', 'An aggregation of resources.'),
(24, NULL, 2, 'Dataset', 'Dataset', 'Data encoded in a defined structure.'),
(25, NULL, 2, 'Event', 'Event', 'A non-persistent, time-based occurrence.'),
(26, NULL, 2, 'Image', 'Image', 'A visual representation other than text.'),
(27, NULL, 2, 'InteractiveResource', 'Interactive Resource', 'A resource requiring interaction from the user to be understood, executed, or experienced.'),
(28, NULL, 2, 'Service', 'Service', 'A system that provides one or more functions.'),
(29, NULL, 2, 'Software', 'Software', 'A computer program in source or compiled form.'),
(30, NULL, 2, 'Sound', 'Sound', 'A resource primarily intended to be heard.'),
(31, NULL, 2, 'Text', 'Text', 'A resource consisting primarily of words for reading.'),
(32, NULL, 2, 'PhysicalObject', 'Physical Object', 'An inanimate, three-dimensional object or substance.'),
(33, NULL, 2, 'StillImage', 'Still Image', 'A static visual representation.'),
(34, NULL, 2, 'MovingImage', 'Moving Image', 'A series of visual representations imparting an impression of motion when shown in succession.'),
(35, NULL, 3, 'AcademicArticle', 'Academic Article', 'A scholarly academic article, typically published in a journal.'),
(36, NULL, 3, 'Article', 'Article', 'A written composition in prose, usually nonfiction, on a specific topic, forming an independent part of a book or other publication, as a newspaper or magazine.'),
(37, NULL, 3, 'AudioDocument', 'audio document', 'An audio document; aka record.'),
(38, NULL, 3, 'AudioVisualDocument', 'audio-visual document', 'An audio-visual document; film, video, and so forth.'),
(39, NULL, 3, 'Bill', 'Bill', 'Draft legislation presented for discussion to a legal body.'),
(40, NULL, 3, 'Book', 'Book', 'A written or printed work of fiction or nonfiction, usually on sheets of paper fastened or bound together within covers.'),
(41, NULL, 3, 'BookSection', 'Book Section', 'A section of a book.'),
(42, NULL, 3, 'Brief', 'Brief', 'A written argument submitted to a court.'),
(43, NULL, 3, 'Chapter', 'Chapter', 'A chapter of a book.'),
(44, NULL, 3, 'Code', 'Code', 'A collection of statutes.'),
(45, NULL, 3, 'CollectedDocument', 'Collected Document', 'A document that simultaneously contains other documents.'),
(46, NULL, 3, 'Collection', 'Collection', 'A collection of Documents or Collections'),
(47, NULL, 3, 'Conference', 'Conference', 'A meeting for consultation or discussion.'),
(48, NULL, 3, 'CourtReporter', 'Court Reporter', 'A collection of legal cases.'),
(49, NULL, 3, 'Document', 'Document', 'A document (noun) is a bounded physical representation of body of information designed with the capacity (and usually intent) to communicate. A document may manifest symbolic, diagrammatic or sensory-representational information.'),
(50, NULL, 3, 'DocumentPart', 'document part', 'a distinct part of a larger document or collected document.'),
(51, NULL, 3, 'DocumentStatus', 'Document Status', 'The status of the publication of a document.'),
(52, NULL, 3, 'EditedBook', 'Edited Book', 'An edited book.'),
(53, NULL, 3, 'Email', 'EMail', 'A written communication addressed to a person or organization and transmitted electronically.'),
(54, NULL, 3, 'Event', 'Event', NULL),
(55, NULL, 3, 'Excerpt', 'Excerpt', 'A passage selected from a larger work.'),
(56, NULL, 3, 'Film', 'Film', 'aka movie.'),
(57, NULL, 3, 'Hearing', 'Hearing', 'An instance or a session in which testimony and arguments are presented, esp. before an official, as a judge in a lawsuit.'),
(58, NULL, 3, 'Image', 'Image', 'A document that presents visual or diagrammatic information.'),
(59, NULL, 3, 'Interview', 'Interview', 'A formalized discussion between two or more people.'),
(60, NULL, 3, 'Issue', 'Issue', 'something that is printed or published and distributed, esp. a given number of a periodical'),
(61, NULL, 3, 'Journal', 'Journal', 'A periodical of scholarly journal Articles.'),
(62, NULL, 3, 'LegalCaseDocument', 'Legal Case Document', 'A document accompanying a legal case.'),
(63, NULL, 3, 'LegalDecision', 'Decision', 'A document containing an authoritative determination (as a decree or judgment) made after consideration of facts or law.'),
(64, NULL, 3, 'LegalDocument', 'Legal Document', 'A legal document; for example, a court decision, a brief, and so forth.'),
(65, NULL, 3, 'Legislation', 'Legislation', 'A legal document proposing or enacting a law or a group of laws.'),
(66, NULL, 3, 'Letter', 'Letter', 'A written or printed communication addressed to a person or organization and usually transmitted by mail.'),
(67, NULL, 3, 'Magazine', 'Magazine', 'A periodical of magazine Articles. A magazine is a publication that is issued periodically, usually bound in a paper cover, and typically contains essays, stories, poems, etc., by many writers, and often photographs and drawings, frequently specializing in a particular subject or area, as hobbies, news, or sports.'),
(68, NULL, 3, 'Manual', 'Manual', 'A small reference book, especially one giving instructions.'),
(69, NULL, 3, 'Manuscript', 'Manuscript', 'An unpublished Document, which may also be submitted to a publisher for publication.'),
(70, NULL, 3, 'Map', 'Map', 'A graphical depiction of geographic features.'),
(71, NULL, 3, 'MultiVolumeBook', 'Multivolume Book', 'A loose, thematic, collection of Documents, often Books.'),
(72, NULL, 3, 'Newspaper', 'Newspaper', 'A periodical of documents, usually issued daily or weekly, containing current news, editorials, feature articles, and usually advertising.'),
(73, NULL, 3, 'Note', 'Note', 'Notes or annotations about a resource.'),
(74, NULL, 3, 'Patent', 'Patent', 'A document describing the exclusive right granted by a government to an inventor to manufacture, use, or sell an invention for a certain number of years.'),
(75, NULL, 3, 'Performance', 'Performance', 'A public performance.'),
(76, NULL, 3, 'Periodical', 'Periodical', 'A group of related documents issued at regular intervals.'),
(77, NULL, 3, 'PersonalCommunication', 'Personal Communication', 'A communication between an agent and one or more specific recipients.'),
(78, NULL, 3, 'PersonalCommunicationDocument', 'Personal Communication Document', 'A personal communication manifested in some document.'),
(79, NULL, 3, 'Proceedings', 'Proceedings', 'A compilation of documents published from an event, such as a conference.'),
(80, NULL, 3, 'Quote', 'Quote', 'An excerpted collection of words.'),
(81, NULL, 3, 'ReferenceSource', 'Reference Source', 'A document that presents authoritative reference information, such as a dictionary or encylopedia .'),
(82, NULL, 3, 'Report', 'Report', 'A document describing an account or statement describing in detail an event, situation, or the like, usually as the result of observation, inquiry, etc..'),
(83, NULL, 3, 'Series', 'Series', 'A loose, thematic, collection of Documents, often Books.'),
(84, NULL, 3, 'Slide', 'Slide', 'A slide in a slideshow'),
(85, NULL, 3, 'Slideshow', 'Slideshow', 'A presentation of a series of slides, usually presented in front of an audience with written text and images.'),
(86, NULL, 3, 'Standard', 'Standard', 'A document describing a standard'),
(87, NULL, 3, 'Statute', 'Statute', 'A bill enacted into law.'),
(88, NULL, 3, 'Thesis', 'Thesis', 'A document created to summarize research findings associated with the completion of an academic degree.'),
(89, NULL, 3, 'ThesisDegree', 'Thesis degree', 'The academic degree of a Thesis'),
(90, NULL, 3, 'Webpage', 'Webpage', 'A web page is an online document available (at least initially) on the world wide web. A web page is written first and foremost to appear on the web, as distinct from other online resources such as books, manuscripts or audio documents which use the web primarily as a distribution mechanism alongside other more traditional methods such as print.'),
(91, NULL, 3, 'Website', 'Website', 'A group of Webpages accessible on the Web.'),
(92, NULL, 3, 'Workshop', 'Workshop', 'A seminar, discussion group, or the like, that emphasizes zxchange of ideas and the demonstration and application of techniques, skills, etc.'),
(93, NULL, 4, 'LabelProperty', 'Label Property', 'A foaf:LabelProperty is any RDF property with texual values that serve as labels.'),
(94, NULL, 4, 'Person', 'Person', 'A person.'),
(95, NULL, 4, 'Document', 'Document', 'A document.'),
(96, NULL, 4, 'Organization', 'Organization', 'An organization.'),
(97, NULL, 4, 'Group', 'Group', 'A class of Agents.'),
(98, NULL, 4, 'Agent', 'Agent', 'An agent (eg. person, group, software or physical artifact).'),
(99, NULL, 4, 'Project', 'Project', 'A project (a collective endeavour of some kind).'),
(100, NULL, 4, 'Image', 'Image', 'An image.'),
(101, NULL, 4, 'PersonalProfileDocument', 'PersonalProfileDocument', 'A personal profile RDF document.'),
(102, NULL, 4, 'OnlineAccount', 'Online Account', 'An online account.'),
(103, NULL, 4, 'OnlineGamingAccount', 'Online Gaming Account', 'An online gaming account.'),
(104, NULL, 4, 'OnlineEcommerceAccount', 'Online E-commerce Account', 'An online e-commerce account.'),
(105, NULL, 4, 'OnlineChatAccount', 'Online Chat Account', 'An online chat account.'),
(106, NULL, 5, 'SemanticPosition', 'SemanticPosition', NULL),
(107, NULL, 5, 'Crible', 'Crible', NULL),
(108, NULL, 5, 'CriblePosition', 'CriblePosition', NULL),
(109, NULL, 5, 'CribleCarto', 'Cartographie d\'un crible', NULL),
(110, NULL, 5, 'Actant', 'Actant', NULL),
(111, NULL, 5, 'Existence', 'Existence', NULL),
(112, NULL, 5, 'Physique', 'Physique', NULL),
(113, NULL, 5, 'Rapport', 'Rapport', NULL),
(114, NULL, 5, 'Archetype', 'Archetype', NULL),
(115, NULL, 5, 'Concept', 'Concept', NULL),
(116, NULL, 6, 'Concept', 'Concept', NULL),
(117, NULL, 6, 'ConceptScheme', 'Concept Scheme', NULL),
(118, NULL, 6, 'Collection', 'Collection', NULL),
(119, NULL, 6, 'OrderedCollection', 'Ordered Collection', NULL),
(120, NULL, 8, 'Annotation', 'Annotation', 'The class for Web Annotations.'),
(121, NULL, 8, 'Choice', 'Choice', 'A subClass of  as:OrderedCollection  that conveys to a consuming application that it should select one of the resources in the  as:items  list to use, rather than all of them.  This is typically used to provide a choice of resources to render to the user, based on further supplied properties.  If the consuming application cannot determine the user\'s preference, then it should use the first in the list.'),
(122, NULL, 8, 'CssSelector', 'Css selector', 'A CssSelector describes a Segment of interest in a representation that conforms to the Document Object Model through the use of the CSS selector specification.'),
(123, NULL, 8, 'CssStyle', 'Css style', 'A resource which describes styles for resources participating in the Annotation using CSS.'),
(124, NULL, 8, 'DataPositionSelector', 'Data position selector', 'DataPositionSelector describes a range of data by recording the start and end positions of the selection in the stream. Position 0 would be immediately before the first byte, position 1 would be immediately before the second byte, and so on. The start byte is thus included in the list, but the end byte is not.'),
(125, NULL, 8, 'Direction', 'Direction', 'A class to encapsulate the different text directions that a textual resource might take.  It is not used directly in the Annotation Model, only its three instances.'),
(126, NULL, 8, 'FragmentSelector', 'Fragment selector', 'The FragmentSelector class is used to record the segment of a representation using the IRI fragment specification defined by the representation\'s media type.'),
(127, NULL, 8, 'HttpRequestState', 'Http request state', 'The HttpRequestState class is used to record the HTTP request headers that a client SHOULD use to request the correct representation from the resource. '),
(128, NULL, 8, 'Motivation', 'Motivation', 'The Motivation class is used to record the user\'s intent or motivation for the creation of the Annotation, or the inclusion of the body or target, that it is associated with.'),
(129, NULL, 8, 'RangeSelector', 'Range selector', 'A Range Selector can be used to identify the beginning and the end of the selection by using other Selectors. The selection consists of everything from the beginning of the starting selector through to the beginning of the ending selector, but not including it.'),
(130, NULL, 8, 'ResourceSelection', 'Resource selection', 'Instances of the ResourceSelection class identify part (described by an oa:Selector) of another resource (referenced with oa:hasSource), possibly from a particular representation of a resource (described by an oa:State). Please note that ResourceSelection is not used directly in the Web Annotation model, but is provided as a separate class for further application profiles to use, separate from oa:SpecificResource which has many Annotation specific features.'),
(131, NULL, 8, 'Selector', 'Selector', 'A resource which describes the segment of interest in a representation of a Source resource, indicated with oa:hasSelector from the Specific Resource. This class is not used directly in the Annotation model, only its subclasses.'),
(132, NULL, 8, 'SpecificResource', 'Specific resource', 'Instances of the SpecificResource class identify part of another resource (referenced with oa:hasSource), a particular representation of a resource, a resource with styling hints for renders, or any combination of these, as used within an Annotation.'),
(133, NULL, 8, 'State', 'State', 'A State describes the intended state of a resource as applied to the particular Annotation, and thus provides the information needed to retrieve the correct representation of that resource.'),
(134, NULL, 8, 'Style', 'Style', 'A Style describes the intended styling of a resource as applied to the particular Annotation, and thus provides the information to ensure that rendering is consistent across implementations.'),
(135, NULL, 8, 'SvgSelector', 'Svg selector', 'An SvgSelector defines an area through the use of the Scalable Vector Graphics [SVG] standard. This allows the user to select a non-rectangular area of the content, such as a circle or polygon by describing the region using SVG. The SVG may be either embedded within the Annotation or referenced as an External Resource.'),
(136, NULL, 8, 'TextPositionSelector', 'Text position selector', 'The TextPositionSelector describes a range of text by recording the start and end positions of the selection in the stream. Position 0 would be immediately before the first character, position 1 would be immediately before the second character, and so on.'),
(137, NULL, 8, 'TextQuoteSelector', 'Text quote selector', 'The TextQuoteSelector describes a range of text by copying it, and including some of the text immediately before (a prefix) and after (a suffix) it to distinguish between multiple copies of the same sequence of characters.'),
(138, NULL, 8, 'TextualBody', 'Textual body', ''),
(139, NULL, 8, 'TimeState', 'Time state', 'A TimeState records the time at which the resource\'s state is appropriate for the Annotation, typically the time that the Annotation was created and/or a link to a persistent copy of the current version.'),
(140, NULL, 8, 'XPathSelector', 'XPath selector', ' An XPathSelector is used to select elements and content within a resource that supports the Document Object Model via a specified XPath value.'),
(141, NULL, 9, 'Property', 'Property', 'The class of RDF properties.'),
(142, NULL, 9, 'Statement', 'Statement', 'The class of RDF statements.'),
(143, NULL, 9, 'Bag', 'Bag', 'The class of unordered containers.'),
(144, NULL, 9, 'Seq', 'Seq', 'The class of ordered containers.'),
(145, NULL, 9, 'Alt', 'Alt', 'The class of containers of alternatives.'),
(146, NULL, 9, 'List', 'List', 'The class of RDF Lists.');

-- --------------------------------------------------------

--
-- Structure de la table `resource_template`
--

CREATE TABLE `resource_template` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `resource_class_id` int(11) DEFAULT NULL,
  `title_property_id` int(11) DEFAULT NULL,
  `description_property_id` int(11) DEFAULT NULL,
  `label` varchar(190) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `resource_template`
--

INSERT INTO `resource_template` (`id`, `owner_id`, `resource_class_id`, `title_property_id`, `description_property_id`, `label`) VALUES
(1, NULL, NULL, NULL, NULL, 'Base Resource'),
(2, NULL, 1, NULL, NULL, 'Agent'),
(3, NULL, 82, NULL, NULL, 'Report'),
(4, NULL, 90, NULL, NULL, 'Web document'),
(5, NULL, 107, NULL, NULL, 'Tool'),
(6, NULL, 120, NULL, NULL, 'Annotation');

-- --------------------------------------------------------

--
-- Structure de la table `resource_template_property`
--

CREATE TABLE `resource_template_property` (
  `id` int(11) NOT NULL,
  `resource_template_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `alternate_label` varchar(255) DEFAULT NULL,
  `alternate_comment` longtext DEFAULT NULL,
  `position` int(11) DEFAULT NULL,
  `data_type` longtext DEFAULT NULL COMMENT '(DC2Type:json_array)',
  `is_required` tinyint(1) NOT NULL,
  `is_private` tinyint(1) NOT NULL,
  `default_lang` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `resource_template_property`
--

INSERT INTO `resource_template_property` (`id`, `resource_template_id`, `property_id`, `alternate_label`, `alternate_comment`, `position`, `data_type`, `is_required`, `is_private`, `default_lang`) VALUES
(1, 1, 1, NULL, NULL, 1, NULL, 0, 0, NULL),
(2, 1, 15, NULL, NULL, 2, NULL, 0, 0, NULL),
(3, 1, 8, NULL, NULL, 3, NULL, 0, 0, NULL),
(4, 1, 2, NULL, NULL, 4, NULL, 0, 0, NULL),
(5, 1, 7, NULL, NULL, 5, NULL, 0, 0, NULL),
(6, 1, 4, NULL, NULL, 6, NULL, 0, 0, NULL),
(7, 1, 9, NULL, NULL, 7, NULL, 0, 0, NULL),
(8, 1, 12, NULL, NULL, 8, NULL, 0, 0, NULL),
(9, 1, 40, 'Place', NULL, 9, NULL, 0, 0, NULL),
(10, 1, 5, NULL, NULL, 10, NULL, 0, 0, NULL),
(11, 1, 17, NULL, NULL, 11, NULL, 0, 0, NULL),
(12, 1, 6, NULL, NULL, 12, NULL, 0, 0, NULL),
(13, 1, 25, NULL, NULL, 13, NULL, 0, 0, NULL),
(14, 1, 10, NULL, NULL, 14, NULL, 0, 0, NULL),
(15, 1, 13, NULL, NULL, 15, NULL, 0, 0, NULL),
(16, 1, 29, NULL, NULL, 16, NULL, 0, 0, NULL),
(17, 1, 30, NULL, NULL, 17, NULL, 0, 0, NULL),
(18, 1, 50, NULL, NULL, 18, NULL, 0, 0, NULL),
(19, 1, 3, NULL, NULL, 19, NULL, 0, 0, NULL),
(20, 1, 41, NULL, NULL, 20, NULL, 0, 0, NULL),
(21, 2, 1, NULL, NULL, 1, NULL, 0, 0, NULL),
(22, 2, 4, NULL, NULL, 2, NULL, 0, 0, NULL),
(23, 2, 8, NULL, NULL, 3, NULL, 0, 0, NULL),
(24, 2, 35, NULL, NULL, 4, NULL, 0, 0, NULL),
(25, 2, 36, NULL, NULL, 5, NULL, 0, 0, NULL),
(26, 3, 1, NULL, NULL, 1, NULL, 0, 0, NULL),
(27, 3, 4, NULL, NULL, 2, NULL, 0, 0, NULL),
(28, 3, 2, NULL, NULL, 3, NULL, 0, 0, NULL),
(29, 2, 197, NULL, NULL, 6, NULL, 0, 0, NULL),
(30, 3, 11, NULL, NULL, 4, NULL, 0, 0, NULL),
(31, 3, 250, NULL, NULL, 5, NULL, 0, 0, NULL),
(32, 4, 1, NULL, NULL, 1, NULL, 0, 0, NULL),
(33, 4, 4, NULL, NULL, 2, NULL, 0, 0, NULL),
(34, 4, 121, NULL, NULL, 3, NULL, 0, 0, NULL),
(35, 4, 250, NULL, NULL, 4, NULL, 0, 0, NULL),
(36, 5, 1, NULL, NULL, 1, NULL, 0, 0, NULL),
(37, 5, 4, NULL, NULL, 2, NULL, 0, 0, NULL),
(38, 5, 121, NULL, NULL, 3, NULL, 0, 0, NULL),
(39, 6, 273, 'Motivated by', NULL, 1, '[\"customvocab:1\"]', 0, 0, NULL),
(40, 6, 291, 'Value', 'May be used for body textual content and/or json/xml/svg, etc. target selector.', 2, '[\"literal\"]', 0, 0, NULL),
(41, 6, 266, 'Has purpose', NULL, 3, '[\"customvocab:1\"]', 0, 0, NULL),
(42, 6, 12, NULL, 'Language of the textual body.', 4, '[\"literal\"]', 0, 0, NULL),
(43, 6, 269, 'Has source', NULL, 5, '[\"resource\"]', 0, 0, NULL),
(44, 6, 9, NULL, 'The format of the selector, if any', 6, NULL, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `session`
--

CREATE TABLE `session` (
  `id` varchar(190) NOT NULL,
  `data` longblob NOT NULL,
  `modified` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `session`
--

INSERT INTO `session` (`id`, `data`, `modified`) VALUES
('251293cd781d3f999e7b8f4679a22d9c', 0x5f5f4c616d696e61737c613a363a7b733a32303a225f524551554553545f4143434553535f54494d45223b643a313739323339393436332e3037373533383b733a363a225f56414c4944223b613a313a7b733a32383a224c616d696e61735c53657373696f6e5c56616c696461746f725c4964223b733a33323a223261666635313730633461366437353164643637386439653737313965383833223b7d733a34323a224c616d696e61735f56616c696461746f725f437372665f73616c745f6c6f67696e666f726d5f63737266223b613a313a7b733a363a22455850495245223b693a313739313133323836313b7d733a33323a224c616d696e61735f56616c696461746f725f437372665f73616c745f63737266223b613a313a7b733a363a22455850495245223b693a313739323433313238373b7d733a35373a224c616d696e61735f56616c696461746f725f437372665f73616c745f6561737961646d696e5f656e61626c655f656e68616e63656d656e7473223b613a313a7b733a363a22455850495245223b693a313739313038393938313b7d733a34343a224c616d696e61735f56616c696461746f725f437372665f73616c745f636f6e6669726d666f726d5f63737266223b613a313a7b733a363a22455850495245223b693a313739323434323438383b7d7d72656469726563745f75726c7c733a35303a2268747470733a2f2f68756d616e756d2d70382e66722f6f6d6b5f6368616f746963756d73656d696e6172696f2f61646d696e223b4c616d696e61735f56616c696461746f725f437372665f73616c745f6c6f67696e666f726d5f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a313a7b733a33323a223531353035626431323864346363616431303966636230623834303030383337223b733a33323a223038643536383336656633346161626264376136363462346638376131323163223b7d733a343a2268617368223b733a36353a2230386435363833366566333461616262643761363634623466383761313231632d3531353035626431323864346363616431303966636230623834303030383337223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f417574687c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a313a7b733a373a2273746f72616765223b693a333b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4f6d656b614d657373656e6765727c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a303a7b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f56616c696461746f725f437372665f73616c745f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a313a7b733a33323a223665393937323331363739633231633164343865303735366532366432303461223b733a33323a223030363430323139643437613861336561336261643964613634626238643231223b7d733a343a2268617368223b733a36353a2230303634303231396434376138613365613362616439646136346262386432312d3665393937323331363739633231633164343865303735366532366432303461223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f56616c696461746f725f437372665f73616c745f6561737961646d696e5f656e61626c655f656e68616e63656d656e74737c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a323a7b733a33323a226131373833633161333935616133623831653961616238636236396162636138223b733a33323a226136303433646239303736373263396430353939646563386463626334613763223b733a33323a223932623364613965626462623266393566343134666539613736643163346330223b733a33323a223139613564636662386335313362333530383939383365336562343736363264223b7d733a343a2268617368223b733a36353a2231396135646366623863353133623335303839393833653365623437363632642d3932623364613965626462623266393566343134666539613736643163346330223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4561737941646d696e7c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a31343a226c61737442726f77736550616765223b613a313a7b733a353a2261646d696e223b613a313a7b733a353a226974656d73223b733a33343a222f6f6d6b5f6368616f746963756d73656d696e6172696f2f61646d696e2f6974656d223b7d7d733a393a226c6173745175657279223b613a313a7b733a353a2261646d696e223b613a313a7b733a353a226974656d73223b613a353a7b733a31353a22736f72745f62795f64656661756c74223b733a303a22223b733a31383a22736f72745f6f726465725f64656661756c74223b733a303a22223b733a373a22736f72745f6279223b733a323a226964223b733a31303a22736f72745f6f72646572223b733a343a2264657363223b733a343a2270616765223b693a313b7d7d7d7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f56616c696461746f725f437372665f73616c745f636f6e6669726d666f726d5f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a363a7b733a33323a223734653032366332303538386137613733643831346334666364366636346631223b733a33323a223732613635373061386333643138653465643966376336643635616365303133223b733a33323a223665626534353664353633313131313036353435323730616565613931343631223b733a33323a223837623561383466656263656336643832663732363335343232653963633135223b733a33323a226237393665666133353236376561646334396662346235643230393238323464223b733a33323a226264343931393663363537613961663466363862343033323239616233646264223b733a33323a223136663761366161396364616433623830333632346133666232376534363335223b733a33323a226537376430396434376362626138306663333039643265373838376164376238223b733a33323a226364333963366238356235366238343261363666306238663738666336333461223b733a33323a223732383838663431333664623635316536643039386466326239366630333939223b733a33323a226232336665353065393232646339643237386438313431623033663539336336223b733a33323a223132316234616565393436623434646166373933356466323964316530353861223b7d733a343a2268617368223b733a36353a2231323162346165653934366234346461663739333564663239643165303538612d6232336665353065393232646339643237386438313431623033663539336336223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d, 1792399463),
('463e9b2ce9f7ac93e4f0e806d50bf8c2', 0x5f5f4c616d696e61737c613a353a7b733a32303a225f524551554553545f4143434553535f54494d45223b643a313739303530323635382e3835393733353b733a363a225f56414c4944223b613a313a7b733a32383a224c616d696e61735c53657373696f6e5c56616c696461746f725c4964223b733a33323a226239643735666437366662373135333138353832366632353831626664353530223b7d733a34323a224c616d696e61735f56616c696461746f725f437372665f73616c745f6c6f67696e666f726d5f63737266223b613a313a7b733a363a22455850495245223b693a313739303534353737303b7d733a34343a224c616d696e61735f56616c696461746f725f437372665f73616c745f636f6e6669726d666f726d5f63737266223b613a313a7b733a363a22455850495245223b693a313739303534353831363b7d733a33323a224c616d696e61735f56616c696461746f725f437372665f73616c745f63737266223b613a313a7b733a363a22455850495245223b693a313739303534353835323b7d7d72656469726563745f75726c7c733a33353a2268747470733a2f2f68756d616e756d2d70382e66722f6f6d6b5f6170662f61646d696e223b4c616d696e61735f56616c696461746f725f437372665f73616c745f6c6f67696e666f726d5f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a313a7b733a33323a226366356664313837363863333536646363356466313534363234666566373337223b733a33323a226437656530333535353835363366346265316163366566376637613435373734223b7d733a343a2268617368223b733a36353a2264376565303335353538353633663462653161633665663766376134353737342d6366356664313837363863333536646363356466313534363234666566373337223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f417574687c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a303a7b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4f6d656b614d657373656e6765727c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a313a7b733a383a226d65737361676573223b613a313a7b693a313b613a313a7b693a303b733a32333a225375636365737366756c6c79206c6f67676564206f7574223b7d7d7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f56616c696461746f725f437372665f73616c745f636f6e6669726d666f726d5f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a323a7b733a33323a223736613362333237336336633334633230373135653365366630316638663735223b733a33323a226237306265333333393836393161323465616636613936363534396165326539223b733a33323a223531363863656235343434653634326231363333366433346162323131373231223b733a33323a223532633165336464623565393633333937623839353632316565376265623533223b7d733a343a2268617368223b733a36353a2235326331653364646235653936333339376238393536323165653762656235332d3531363863656235343434653634326231363333366433346162323131373231223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f56616c696461746f725f437372665f73616c745f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a343a7b733a33323a223934356132616535633265336235323838386266666436663164316331396266223b733a33323a226638393335393039393461386335393830303763656136383863303838316439223b733a33323a223533646663373737653666333734356235613964353664303437633538393064223b733a33323a226163376539373630323863313836346334633133356363393439333334356530223b733a33323a223032613035666462396166373135646335316631393535343034343437626136223b733a33323a223933626165623561303765393832326661316634343862323239323664303334223b733a33323a223662353063653835306231633137336433633763663666333461633330383430223b733a33323a223334643161386362373330643031353936643630326135633238383938623537223b7d733a343a2268617368223b733a36353a2233346431613863623733306430313539366436303261356332383839386235372d3662353063653835306231633137336433633763663666333461633330383430223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4561737941646d696e7c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a31343a226c61737442726f77736550616765223b613a313a7b733a353a2261646d696e223b613a313a7b733a353a226974656d73223b733a31393a222f6f6d6b5f6170662f61646d696e2f6974656d223b7d7d733a393a226c6173745175657279223b613a313a7b733a353a2261646d696e223b613a313a7b733a353a226974656d73223b613a353a7b733a31353a22736f72745f62795f64656661756c74223b733a303a22223b733a31383a22736f72745f6f726465725f64656661756c74223b733a303a22223b733a373a22736f72745f6279223b733a323a226964223b733a31303a22736f72745f6f72646572223b733a343a2264657363223b733a343a2270616765223b693a313b7d7d7d7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d, 1790502658),
('49070989b9784215f3d688d8e289c8bc', 0x5f5f4c616d696e61737c613a323a7b733a32303a225f524551554553545f4143434553535f54494d45223b643a313739303833383431392e3934383732353b733a363a225f56414c4944223b613a313a7b733a32383a224c616d696e61735c53657373696f6e5c56616c696461746f725c4964223b733a33323a223439303730393839623937383432313566336436383864386532383963386263223b7d7d, 1790838420),
('c3aa96975d3edd2249ea0822b6afbb0b', 0x5f5f4c616d696e61737c613a353a7b733a32303a225f524551554553545f4143434553535f54494d45223b643a313739313030323734372e3530303635373b733a363a225f56414c4944223b613a313a7b733a32383a224c616d696e61735c53657373696f6e5c56616c696461746f725c4964223b733a33323a226539663066643133616462623764383831303235656664613663343536643337223b7d733a34323a224c616d696e61735f56616c696461746f725f437372665f73616c745f6c6f67696e666f726d5f63737266223b613a313a7b733a363a22455850495245223b693a313739303534353836323b7d733a34343a224c616d696e61735f56616c696461746f725f437372665f73616c745f636f6e6669726d666f726d5f63737266223b613a313a7b733a363a22455850495245223b693a313739303939313434383b7d733a33323a224c616d696e61735f56616c696461746f725f437372665f73616c745f63737266223b613a313a7b733a363a22455850495245223b693a313739313034353934373b7d7d4c616d696e61735f56616c696461746f725f437372665f73616c745f6c6f67696e666f726d5f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a323a7b733a33323a223430396666363962656437343536626637346336633264326632373562386134223b733a33323a223137336561383130313633663064393161623464613964623064626338616366223b733a33323a226533363963396133316330306236636665646432343633636264313537663934223b733a33323a223032646461393038306139306662353539653137633633376435306237653265223b7d733a343a2268617368223b733a36353a2230326464613930383061393066623535396531376336333764353062376532652d6533363963396133316330306236636665646432343633636264313537663934223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4f6d656b614d657373656e6765727c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a303a7b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f417574687c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a313a7b733a373a2273746f72616765223b693a333b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d72656469726563745f75726c7c4e3b4c616d696e61735f56616c696461746f725f437372665f73616c745f636f6e6669726d666f726d5f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a323a7b733a33323a226433313765633663623265383166623736656631303662393937663565613537223b733a33323a226439313530386131313132633638326561613762613939303531666434393038223b733a33323a223232653563303439646637326331613537393036356533646164633262643235223b733a33323a223132653533396164636635616666323635366564343265313862373035316636223b7d733a343a2268617368223b733a36353a2231326535333961646366356166663236353665643432653138623730353166362d3232653563303439646637326331613537393036356533646164633262643235223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4c616d696e61735f56616c696461746f725f437372665f73616c745f637372667c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a393a22746f6b656e4c697374223b613a323a7b733a33323a223031626564656239633030396664386265356130366538343433353530636632223b733a33323a223439356430363161653665616233643534343531653232623634376465386335223b733a33323a226230383137353265323565303231656161373838373034653561343535303864223b733a33323a223762636535373730326337666231356231616132653663383434653237623230223b7d733a343a2268617368223b733a36353a2237626365353737303263376662313562316161326536633834346532376232302d6230383137353265323565303231656161373838373034653561343535303864223b7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d4561737941646d696e7c4f3a32363a224c616d696e61735c5374646c69625c41727261794f626a656374223a343a7b733a373a2273746f72616765223b613a323a7b733a31343a226c61737442726f77736550616765223b613a313a7b733a353a2261646d696e223b613a313a7b733a353a226974656d73223b733a31393a222f6f6d6b5f6170662f61646d696e2f6974656d223b7d7d733a393a226c6173745175657279223b613a313a7b733a353a2261646d696e223b613a313a7b733a353a226974656d73223b613a353a7b733a31353a22736f72745f62795f64656661756c74223b733a303a22223b733a31383a22736f72745f6f726465725f64656661756c74223b733a303a22223b733a373a22736f72745f6279223b733a323a226964223b733a31303a22736f72745f6f72646572223b733a343a2264657363223b733a343a2270616765223b693a313b7d7d7d7d733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b733a31333a2241727261794974657261746f72223b733a31393a2270726f74656374656450726f70657274696573223b613a343a7b693a303b733a373a2273746f72616765223b693a313b733a343a22666c6167223b693a323b733a31333a226974657261746f72436c617373223b693a333b733a31393a2270726f74656374656450726f70657274696573223b7d7d, 1791002747),
('ed5c618ecfc3c3196787c52ae3d1a912', 0x5f5f4c616d696e61737c613a323a7b733a32303a225f524551554553545f4143434553535f54494d45223b643a313739313039363335322e3734323438373b733a363a225f56414c4944223b613a313a7b733a32383a224c616d696e61735c53657373696f6e5c56616c696461746f725c4964223b733a33323a226564356336313865636663336333313936373837633532616533643161393132223b7d7d, 1791096352);

-- --------------------------------------------------------

--
-- Structure de la table `setting`
--

CREATE TABLE `setting` (
  `id` varchar(190) NOT NULL,
  `value` longtext NOT NULL COMMENT '(DC2Type:json_array)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `setting`
--

INSERT INTO `setting` (`id`, `value`) VALUES
('administrator_email', '\"samuel.szoniecky@univ-paris8.fr\"'),
('annotate_initialized_settings', '\"1\"'),
('annotate_jsonld_old_format', '\"0\"'),
('annotate_public_allow_annotate', '\"0\"'),
('annotate_resource_template_data', '{\"6\":{\"oa:motivatedBy\":\"oa:Annotation\",\"rdf:value\":\"oa:hasBody\",\"oa:hasPurpose\":\"oa:hasBody\",\"dcterms:language\":\"oa:hasBody\",\"oa:hasSource\":\"oa:hasTarget\",\"dcterms:format\":\"oa:hasTarget\"}}'),
('annotate_w3c_creator_fields', '[\"name\"]'),
('batch_chunk_size', '\"100\"'),
('default_site', '\"\"'),
('default_to_private_item_sets', '\"0\"'),
('default_to_private_items', '\"0\"'),
('default_to_private_site_pages', '\"0\"'),
('default_to_private_sites', '\"0\"'),
('disable_file_validation', '\"0\"'),
('disable_jsonld_embed', '\"0\"'),
('disable_jsonld_reverse', '\"0\"'),
('easyadmin_addon_notify_version_dev', '\"0\"'),
('easyadmin_addon_notify_version_inactive', '\"1\"'),
('easyadmin_administrator_name', '\"\"'),
('easyadmin_allow_empty_files', '\"0\"'),
('easyadmin_asset_extensions', '[]'),
('easyadmin_asset_media_types', '[]'),
('easyadmin_config_apply_button', '\"0\"'),
('easyadmin_cron_last', '1792399274'),
('easyadmin_cron_tasks', '[\"session_8\"]'),
('easyadmin_disable_csrf', '\"0\"'),
('easyadmin_disable_thumbnails', '\"0\"'),
('easyadmin_display_exception', '\"\"'),
('easyadmin_initialized_config', '\"1\"'),
('easyadmin_initialized_settings', '\"1\"'),
('easyadmin_interface', '[\"resource_public_view\"]'),
('easyadmin_local_path', '\"\\/Users\\/samszo\\/Sites\\/omk_agents\\/files\\/import\"'),
('easyadmin_local_path_any', 'false'),
('easyadmin_local_path_any_files', '\"1\"'),
('easyadmin_local_paths', '[]'),
('easyadmin_local_store_base_uri', '\"\"'),
('easyadmin_maintenance_mode', '\"\"'),
('easyadmin_maintenance_text', '\"<p>This site is down for maintenance. Please contact the site administrator for more information.<\\/p>\\n\"'),
('easyadmin_no_reply_email', '\"\"'),
('easyadmin_no_reply_name', '\"\"'),
('easyadmin_quick_template', '[\"2\",\"1\",\"3\",\"5\",\"4\"]'),
('easyadmin_rights_reviewer_delete_all', '\"0\"'),
('easyadmin_settings_enhancements', '\"0\"'),
('easyadmin_user_directories', '\"0\"'),
('extension_whitelist', '[\"aac\",\"aif\",\"aiff\",\"asf\",\"asx\",\"avi\",\"bmp\",\"c\",\"cc\",\"class\",\"css\",\"divx\",\"doc\",\"docx\",\"exe\",\"gif\",\"gz\",\"gzip\",\"h\",\"ico\",\"j2k\",\"jp2\",\"jpe\",\"jpeg\",\"jpg\",\"m4a\",\"m4v\",\"mdb\",\"mid\",\"midi\",\"mov\",\"mp2\",\"mp3\",\"mp4\",\"mpa\",\"mpe\",\"mpeg\",\"mpg\",\"mpp\",\"odb\",\"odc\",\"odf\",\"odg\",\"odp\",\"ods\",\"odt\",\"ogg\",\"opus\",\"pdf\",\"png\",\"pot\",\"pps\",\"ppt\",\"pptx\",\"qt\",\"ra\",\"ram\",\"rtf\",\"rtx\",\"swf\",\"tar\",\"tif\",\"tiff\",\"txt\",\"wav\",\"wax\",\"webm\",\"webp\",\"wma\",\"wmv\",\"wmx\",\"wri\",\"xla\",\"xls\",\"xlsx\",\"xlt\",\"xlw\",\"zip\",\"html\",\"md\",\"json\",\"csv\",\"bib\"]'),
('favicon', '\"\"'),
('installation_title', '\"Chaoticum Seminario\"'),
('locale', '\"\"'),
('log_archive_compress', 'true'),
('log_archive_days', '180'),
('log_archive_delete', 'true'),
('log_archive_delete_job_logs', 'false'),
('log_archive_format', '\"tsv\"'),
('log_archive_include_id', 'false'),
('log_archive_references', '[]'),
('log_archive_severity_max', '0'),
('log_archive_store', 'true'),
('log_archive_translate', 'true'),
('log_cron_days', '180'),
('log_cron_last', '1790433325'),
('media_alt_text_property', '\"\"'),
('media_type_whitelist', '[\"application\\/msword\",\"application\\/ogg\",\"application\\/pdf\",\"application\\/rtf\",\"application\\/vnd.ms-access\",\"application\\/vnd.ms-excel\",\"application\\/vnd.ms-powerpoint\",\"application\\/vnd.ms-project\",\"application\\/vnd.ms-write\",\"application\\/vnd.oasis.opendocument.chart\",\"application\\/vnd.oasis.opendocument.database\",\"application\\/vnd.oasis.opendocument.formula\",\"application\\/vnd.oasis.opendocument.graphics\",\"application\\/vnd.oasis.opendocument.presentation\",\"application\\/vnd.oasis.opendocument.spreadsheet\",\"application\\/vnd.oasis.opendocument.text\",\"application\\/vnd.openxmlformats-officedocument.wordprocessingml.document\",\"application\\/vnd.openxmlformats-officedocument.presentationml.presentation\",\"application\\/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",\"application\\/x-gzip\",\"application\\/x-ms-wmp\",\"application\\/x-msdownload\",\"application\\/x-shockwave-flash\",\"application\\/x-tar\",\"application\\/zip\",\"audio\\/midi\",\"audio\\/mp4\",\"audio\\/mpeg\",\"audio\\/ogg\",\"audio\\/x-aac\",\"audio\\/x-aiff\",\"audio\\/x-ms-wma\",\"audio\\/x-ms-wax\",\"audio\\/x-realaudio\",\"audio\\/x-wav\",\"image\\/bmp\",\"image\\/gif\",\"image\\/jp2\",\"image\\/jpeg\",\"image\\/pjpeg\",\"image\\/png\",\"image\\/tiff\",\"image\\/webp\",\"image\\/x-icon\",\"text\\/css\",\"text\\/plain\",\"text\\/richtext\",\"video\\/divx\",\"video\\/mp4\",\"video\\/mpeg\",\"video\\/ogg\",\"video\\/quicktime\",\"video\\/webm\",\"video\\/x-ms-asf\",\"video\\/x-msvideo\",\"video\\/x-ms-wmv\",\"text\\/html\",\"text\\/markdown\",\"application\\/json\",\"text\\/csv\"]'),
('pagination_per_page', '\"25\"'),
('property_label_information', '\"none\"'),
('recaptcha_secret_key', '\"\"'),
('recaptcha_site_key', '\"\"'),
('time_zone', '\"UTC\"'),
('use_htmlpurifier', '\"1\"'),
('value_languages', '[]'),
('version', '\"4.2.1\"'),
('version_notifications', '\"1\"');

-- --------------------------------------------------------

--
-- Structure de la table `site`
--

CREATE TABLE `site` (
  `id` int(11) NOT NULL,
  `thumbnail_id` int(11) DEFAULT NULL,
  `homepage_id` int(11) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `slug` varchar(190) NOT NULL,
  `theme` varchar(190) NOT NULL,
  `title` varchar(190) NOT NULL,
  `summary` longtext DEFAULT NULL,
  `navigation` longtext NOT NULL COMMENT '(DC2Type:json_array)',
  `item_pool` longtext NOT NULL COMMENT '(DC2Type:json_array)',
  `created` datetime NOT NULL,
  `modified` datetime DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL,
  `assign_new_items` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `site_block_attachment`
--

CREATE TABLE `site_block_attachment` (
  `id` int(11) NOT NULL,
  `block_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `media_id` int(11) DEFAULT NULL,
  `caption` longtext NOT NULL,
  `position` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `site_item_set`
--

CREATE TABLE `site_item_set` (
  `id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `item_set_id` int(11) NOT NULL,
  `position` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `site_page`
--

CREATE TABLE `site_page` (
  `id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `title` varchar(190) NOT NULL,
  `is_public` tinyint(1) NOT NULL,
  `layout_data` longtext DEFAULT NULL COMMENT '(DC2Type:json)',
  `created` datetime NOT NULL,
  `modified` datetime DEFAULT NULL,
  `layout` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `site_page_block`
--

CREATE TABLE `site_page_block` (
  `id` int(11) NOT NULL,
  `page_id` int(11) NOT NULL,
  `layout` varchar(80) NOT NULL,
  `data` longtext NOT NULL COMMENT '(DC2Type:json_array)',
  `layout_data` longtext DEFAULT NULL COMMENT '(DC2Type:json)',
  `position` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `site_permission`
--

CREATE TABLE `site_permission` (
  `id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `site_setting`
--

CREATE TABLE `site_setting` (
  `id` varchar(190) NOT NULL,
  `site_id` int(11) NOT NULL,
  `value` longtext NOT NULL COMMENT '(DC2Type:json_array)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `email` varchar(190) NOT NULL,
  `name` varchar(190) NOT NULL,
  `created` datetime NOT NULL,
  `modified` datetime DEFAULT NULL,
  `password_hash` varchar(60) DEFAULT NULL,
  `role` varchar(190) NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`id`, `email`, `name`, `created`, `modified`, `password_hash`, `role`, `is_active`) VALUES
(3, 'samuel.szoniecky@univ-paris8.fr', 'Samuel Szoniecky', '2026-09-27 09:50:27', '2026-09-27 09:50:46', '$2y$12$4onj6mPWJ1RVfKerEAbSvuyS.JUXO3jVk3zmXg24yL5OzykpOcpuu', 'global_admin', 1);

-- --------------------------------------------------------

--
-- Structure de la table `user_setting`
--

CREATE TABLE `user_setting` (
  `id` varchar(190) NOT NULL,
  `user_id` int(11) NOT NULL,
  `value` longtext NOT NULL COMMENT '(DC2Type:json_array)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_setting`
--

INSERT INTO `user_setting` (`id`, `user_id`, `value`) VALUES
('browse_defaults_admin_item_sets', 3, '{\"sort_by\":\"id\",\"sort_order\":\"desc\"}'),
('browse_defaults_admin_items', 3, '{\"sort_by\":\"id\",\"sort_order\":\"desc\"}'),
('browse_defaults_admin_media', 3, '{\"sort_by\":\"id\",\"sort_order\":\"desc\"}'),
('browse_defaults_admin_sites', 3, '{\"sort_by\":\"title\",\"sort_order\":\"asc\"}'),
('columns_admin_item_sets', 3, '[{\"type\":\"resource_class\",\"default\":null,\"header\":null},{\"type\":\"owner\",\"default\":null,\"header\":null},{\"type\":\"created\",\"default\":null,\"header\":null}]'),
('columns_admin_items', 3, '[{\"type\":\"resource_class\",\"default\":null,\"header\":null},{\"type\":\"owner\",\"default\":null,\"header\":null},{\"type\":\"created\",\"default\":null,\"header\":null}]'),
('columns_admin_media', 3, '[{\"type\":\"resource_class\",\"default\":null,\"header\":null},{\"type\":\"owner\",\"default\":null,\"header\":null},{\"type\":\"created\",\"default\":null,\"header\":null}]'),
('columns_admin_sites', 3, '[{\"type\":\"slug\",\"default\":null,\"header\":null},{\"type\":\"owner\",\"default\":null,\"header\":null},{\"type\":\"created\",\"default\":null,\"header\":null}]'),
('default_resource_template', 3, '\"\"'),
('locale', 3, '\"\"');

-- --------------------------------------------------------

--
-- Structure de la table `value`
--

CREATE TABLE `value` (
  `id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `value_resource_id` int(11) DEFAULT NULL,
  `type` varchar(190) NOT NULL,
  `lang` varchar(190) DEFAULT NULL,
  `value_annotation_id` int(11) DEFAULT NULL,
  `value` longtext DEFAULT NULL,
  `uri` longtext DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `value`
--

INSERT INTO `value` (`id`, `resource_id`, `property_id`, `value_resource_id`, `type`, `lang`, `value_annotation_id`, `value`, `uri`, `is_public`) VALUES
(10248, 1998, 1, NULL, 'literal', NULL, NULL, 'Activités de recherche', NULL, 1),
(10249, 1998, 10, NULL, 'literal', NULL, NULL, 'M9JEPJMI', NULL, 1),
(10250, 1998, 8, NULL, 'literal', NULL, NULL, 'Collection Zotero', NULL, 1),
(10251, 1998, 11, NULL, 'uri', NULL, NULL, 'Collection Zotero Activités de recherche', 'https://www.zotero.org/users/13594/collections/M9JEPJMI', 1),
(10338, 2013, 1, NULL, 'literal', NULL, NULL, 'Configuration chaoticum-seminario – 2026-10-14T13:52:47.747Z', NULL, 1),
(10339, 2013, 4, NULL, 'literal', NULL, NULL, '{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"Usages des intelligences artificielles pour le développement des intelligences collectives\",\n  \"description\": \"Réservée aux élèves du secondaire\\nPour explorer comment les IA transforment\\nnos façons de collaborer, de partager\\nles connaissances et de construire ensemble\\nde nouvelles intelligences collectives.\\nIntervenant : Samuel SZONIECKY\",\n  \"programUrl\": \"https://www.univ-paris8.fr/IMG/pdf/programme-fete-de-la-science-2026.pdf\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\",\n    \"contribution\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"5e2ad041157c\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"/Users/samszo/Sites/ConfErrance/docs\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"5e2ad041157c\"\n  },\n  \"runId\": \"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\n  \"startedAt\": \"2026-10-14T13:52:47.747Z\"\n}', NULL, 1),
(10340, 2013, 8, NULL, 'literal', NULL, NULL, 'Configuration de workflow', NULL, 1),
(10341, 2013, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2', NULL, 1),
(10342, 2013, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:52:47.747Z', NULL, 1),
(10343, 2013, 257, NULL, 'literal', NULL, NULL, 'success', NULL, 1),
(10344, 2013, 251, NULL, 'literal', NULL, NULL, '2026-10-14T13:52:47.747Z', NULL, 1),
(10345, 2013, 252, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.203Z', NULL, 1),
(10346, 2013, 250, NULL, 'literal', NULL, NULL, '{\"tokens\":{\"calls\":19,\"input\":14556,\"output\":3315,\"total\":17871},\"impact\":{\"energyWh\":0.21521457142857142,\"co2g\":0.006886866285714286,\"electricityCost\":0.00004304291428571429,\"apiCost\":0.00414916,\"currency\":\"€\"}}', NULL, 1),
(10347, 2014, 1, NULL, 'literal', NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-10-14T13:53:51.864Z', NULL, 1),
(10348, 2014, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10349, 2014, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/partition.json', NULL, 1),
(10350, 2014, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10351, 2015, 1, NULL, 'literal', NULL, NULL, 'Rapport de la partition – 2026-10-14T13:53:51.864Z', NULL, 1),
(10352, 2015, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10353, 2015, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/rapport_chaoticum.md', NULL, 1),
(10354, 2015, 9, NULL, 'literal', NULL, NULL, 'text/markdown', NULL, 1),
(10355, 2016, 1, NULL, 'literal', NULL, NULL, 'Diapo AAQ_2021 27 (écran 2) – 2026-10-14T13:53:51.864Z', NULL, 1),
(10356, 2016, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10357, 2016, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_02.png', NULL, 1),
(10358, 2016, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10359, 2017, 1, NULL, 'literal', NULL, NULL, 'Diapo tdcw25 12 (écran 7) – 2026-10-14T13:53:51.864Z', NULL, 1),
(10360, 2017, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10361, 2017, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_07.png', NULL, 1),
(10362, 2017, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10363, 2018, 1, NULL, 'literal', NULL, NULL, 'Diapo ValPedArNum 13 (écran 12) – 2026-10-14T13:53:51.864Z', NULL, 1),
(10364, 2018, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10365, 2018, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_12.png', NULL, 1),
(10366, 2018, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10367, 2019, 1, NULL, 'literal', NULL, NULL, 'Diapo HDR 22 (écran 17) – 2026-10-14T13:53:51.864Z', NULL, 1),
(10368, 2019, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10369, 2019, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_17.png', NULL, 1),
(10370, 2019, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10371, 2020, 1, NULL, 'literal', NULL, NULL, 'Diapo ia-iv-humain-2026 2 (écran 22) – 2026-10-14T13:53:51.864Z', NULL, 1),
(10372, 2020, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10373, 2020, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_22.png', NULL, 1),
(10374, 2020, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10375, 2021, 1, NULL, 'literal', NULL, NULL, 'Diapo repyramidage 4 (écran 27) – 2026-10-14T13:53:51.864Z', NULL, 1),
(10376, 2021, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:53:51.864Z', NULL, 1),
(10377, 2021, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/diapo_27.png', NULL, 1),
(10378, 2021, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10379, 2022, 1, NULL, 'literal', NULL, NULL, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 14/10/2026 15:55:28', NULL, 1),
(10380, 2022, 8, NULL, 'literal', NULL, NULL, 'Participation chaoticumSeminario', NULL, 1),
(10381, 2022, 10, NULL, 'literal', NULL, NULL, '2026-10-14T13-57-46-873Z-5c18c3', NULL, 1),
(10382, 2022, 7, NULL, 'literal', NULL, NULL, '2026-10-14T13:55:28.084Z', NULL, 1),
(10383, 2022, 4, NULL, 'literal', NULL, NULL, 'Séance du 14/10/2026 15:55:28 (en direct) : 28 passage(s) d\'écran, 2 min, 0 contribution(s), 0 écran(s) très dépassé(s).', NULL, 1),
(10384, 2022, 13, 2013, 'resource', NULL, NULL, NULL, NULL, 1),
(10385, 2022, 250, NULL, 'literal', NULL, NULL, '{\"runId\":\"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\"mode\":\"live\",\"elapsedSeconds\":138,\"events\":28,\"contributions\":0,\"share\":\"b374ed9d55d0ac2ba3d34794afea19cb\"}', NULL, 1),
(10386, 2023, 1, NULL, 'literal', NULL, NULL, 'Participation 2026-10-14T13-57-46-873Z-5c18c3', NULL, 1),
(10387, 2023, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-14T13-57-46-873Z-5c18c3.json', NULL, 1),
(10388, 2023, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10389, 2024, 1, NULL, 'literal', NULL, NULL, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:19:53', NULL, 1),
(10390, 2024, 8, NULL, 'literal', NULL, NULL, 'Participation chaoticumSeminario', NULL, 1),
(10391, 2024, 10, NULL, 'literal', NULL, NULL, '2026-10-17T06-22-33-415Z-8523f5', NULL, 1),
(10392, 2024, 7, NULL, 'literal', NULL, NULL, '2026-10-17T06:19:53.350Z', NULL, 1),
(10393, 2024, 4, NULL, 'literal', NULL, NULL, 'Séance du 17/10/2026 08:19:53 (en direct) : 2 passage(s) d\'écran, 3 min, 0 contribution(s), 2 écran(s) très dépassé(s), 4 annotation(s) du public.', NULL, 1),
(10394, 2024, 13, 2013, 'resource', NULL, NULL, NULL, NULL, 1),
(10395, 2024, 250, NULL, 'literal', NULL, NULL, '{\"runId\":\"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\"mode\":\"live\",\"elapsedSeconds\":160,\"events\":2,\"contributions\":0,\"share\":\"bab394878d2a784250bf442c462766c4\"}', NULL, 1),
(10396, 2025, 1, NULL, 'literal', NULL, NULL, 'Participation 2026-10-17T06-22-33-415Z-8523f5', NULL, 1),
(10397, 2025, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-17T06-22-33-415Z-8523f5.json', NULL, 1),
(10398, 2025, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10399, 2026, 1, NULL, 'literal', NULL, NULL, 'Participation – Usages des intelligences artificielles pour le développement des intelligences collectives – 17/10/2026 08:24:07', NULL, 1),
(10400, 2026, 8, NULL, 'literal', NULL, NULL, 'Participation chaoticumSeminario', NULL, 1),
(10401, 2026, 10, NULL, 'literal', NULL, NULL, '2026-10-17T06-27-26-080Z-65af31', NULL, 1),
(10402, 2026, 7, NULL, 'literal', NULL, NULL, '2026-10-17T06:24:07.346Z', NULL, 1),
(10403, 2026, 4, NULL, 'literal', NULL, NULL, 'Séance du 17/10/2026 08:24:07 (en direct) : 3 passage(s) d\'écran, 3 min, 0 contribution(s), 1 écran(s) très dépassé(s).', NULL, 1),
(10404, 2026, 13, 2013, 'resource', NULL, NULL, NULL, NULL, 1),
(10405, 2026, 250, NULL, 'literal', NULL, NULL, '{\"runId\":\"a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2\",\"mode\":\"live\",\"elapsedSeconds\":199,\"events\":3,\"contributions\":0,\"share\":\"99748dab4311be081b395e606b0a460e\"}', NULL, 1),
(10406, 2027, 1, NULL, 'literal', NULL, NULL, 'Participation 2026-10-17T06-27-26-080Z-65af31', NULL, 1),
(10407, 2027, 10, NULL, 'literal', NULL, NULL, 'a014a8e6-500a-4c2b-8ec8-d7b69e0b03d2/participation_2026-10-17T06-27-26-080Z-65af31.json', NULL, 1),
(10408, 2027, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10409, 2028, 1, NULL, 'literal', NULL, NULL, 'Configuration chaoticum-seminario – 2026-10-24T05:14:17.337Z', NULL, 1),
(10410, 2028, 4, NULL, 'literal', NULL, NULL, '{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"Jean-Pierre Balpe, (méta-)auteur : l’écriture infinie  \",\n  \"description\": \"Jean-Pierre Balpe, un des premiers auteurs et théoriciens en France à s’intéresser au potentiel créatif littéraire de l’informatique mais demeurant très peu connu du grand public, travaille depuis presqu’un demi-siècle à la génération automatique de textes comme un mode de création littéraire qui interroge nos présupposés au sujet du langage, de l’écriture et de la littérature. Au cours des années, il a suivi de près l’évolution des outils et des environnements numériques, développant des générateurs de plus en plus performants d’une part, et investissant d’autre part les réseaux sociaux numériques pour non seulement publier une partie des textes poétiques et narratifs automatiquement générés, mais pour les attribuer à des êtres fictionnels, des « profils » pseudo- ou hétéronymes. La dernière version de son logiciel de génération de textes, une intelligence artificielle symbolique qui est à notre connaissance unique au monde dans son genre par son ampleur et son raffinement, est basée sur une théorie du sens, du langage et de leur rapport au monde, développée par Balpe à partir des questions soulevées par ses efforts de modélisation de l’écriture littéraire générative (Balpe 2000, 2021). Elle inclut des millions de données linguistiques accumulées depuis les années 1990, ainsi qu’une grammaire définie manuellement et perfectionnée au fur et à mesure des expérimentations.\",\n  \"programUrl\": \"https://balpe2025.sciencesconf.org/\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"4f0e52bb9bf4\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"/Users/samszo/Sites/ConfErrance/docs\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"4f0e52bb9bf4\"\n  },\n  \"runId\": \"ae2d2164-4a68-4318-a820-4ee7b9f546ac\",\n  \"startedAt\": \"2026-10-24T05:14:17.337Z\"\n}', NULL, 1),
(10411, 2028, 8, NULL, 'literal', NULL, NULL, 'Configuration de workflow', NULL, 1),
(10412, 2028, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac', NULL, 1),
(10413, 2028, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:14:17.337Z', NULL, 1),
(10414, 2028, 257, NULL, 'literal', NULL, NULL, 'success', NULL, 1),
(10415, 2028, 251, NULL, 'literal', NULL, NULL, '2026-10-24T05:14:17.337Z', NULL, 1),
(10416, 2028, 252, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:10.675Z', NULL, 1),
(10417, 2028, 250, NULL, 'literal', NULL, NULL, '{\"tokens\":{\"calls\":33,\"input\":35073,\"output\":4164,\"total\":39237},\"impact\":{\"energyWh\":0.4727282142857143,\"co2g\":0.015127302857142859,\"electricityCost\":0.00009454564285714287,\"apiCost\":0.0077110500000000005,\"currency\":\"€\"}}', NULL, 1),
(10418, 2029, 1, NULL, 'literal', NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10419, 2029, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10420, 2029, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/partition.json', NULL, 1),
(10421, 2029, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10422, 2030, 1, NULL, 'literal', NULL, NULL, 'Rapport de la partition – 2026-10-24T05:15:11.300Z', NULL, 1),
(10423, 2030, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10424, 2030, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/rapport_chaoticum.md', NULL, 1),
(10425, 2030, 9, NULL, 'literal', NULL, NULL, 'text/markdown', NULL, 1),
(10426, 2031, 1, NULL, 'literal', NULL, NULL, 'Diapo seminaireEHESS_2015 9 (écran 2) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10427, 2031, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10428, 2031, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_02.png', NULL, 1),
(10429, 2031, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10430, 2032, 1, NULL, 'literal', NULL, NULL, 'Diapo software_digital-humanitiesII 14 (écran 6) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10431, 2032, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10432, 2032, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_06.png', NULL, 1),
(10433, 2032, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10434, 2033, 1, NULL, 'literal', NULL, NULL, 'Diapo iskoMagreb_2015 18 (écran 10) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10435, 2033, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10436, 2033, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_10.png', NULL, 1),
(10437, 2033, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10438, 2034, 1, NULL, 'literal', NULL, NULL, 'Diapo seminaireEHESS_2015 11 (écran 14) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10439, 2034, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10440, 2034, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_14.png', NULL, 1),
(10441, 2034, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10442, 2035, 1, NULL, 'literal', NULL, NULL, 'Diapo je-creationParis8 26 (écran 18) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10443, 2035, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10444, 2035, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_18.png', NULL, 1),
(10445, 2035, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10446, 2036, 1, NULL, 'literal', NULL, NULL, 'Diapo seminaireEHESS_2015 22 (écran 22) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10447, 2036, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10448, 2036, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_22.png', NULL, 1),
(10449, 2036, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10450, 2037, 1, NULL, 'literal', NULL, NULL, 'Diapo patrimoine 7 (écran 26) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10451, 2037, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10452, 2037, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_26.png', NULL, 1),
(10453, 2037, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10454, 2038, 1, NULL, 'literal', NULL, NULL, 'Diapo seminaireEHESS_2015 7 (écran 30) – 2026-10-24T05:15:11.300Z', NULL, 1),
(10455, 2038, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:15:11.300Z', NULL, 1),
(10456, 2038, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/diapo_30.png', NULL, 1),
(10457, 2038, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10458, 2039, 1, NULL, 'literal', NULL, NULL, 'Participation – Jean-Pierre Balpe, (méta-)auteur : l’écriture infinie   – 24/10/2026 07:16:19', NULL, 1),
(10459, 2039, 8, NULL, 'literal', NULL, NULL, 'Participation chaoticumSeminario', NULL, 1),
(10460, 2039, 10, NULL, 'literal', NULL, NULL, '2026-10-24T05-28-06-155Z-4fc2e2', NULL, 1),
(10461, 2039, 7, NULL, 'literal', NULL, NULL, '2026-10-24T05:16:19.726Z', NULL, 1),
(10462, 2039, 4, NULL, 'literal', NULL, NULL, 'Séance du 24/10/2026 07:16:19 (en direct) : 30 passage(s) d\'écran, 12 min, 0 contribution(s), 1 écran(s) très dépassé(s).', NULL, 1),
(10463, 2039, 13, 2028, 'resource', NULL, NULL, NULL, NULL, 1),
(10464, 2039, 250, NULL, 'literal', NULL, NULL, '{\"runId\":\"ae2d2164-4a68-4318-a820-4ee7b9f546ac\",\"mode\":\"live\",\"elapsedSeconds\":706,\"events\":30,\"contributions\":0,\"share\":\"31a9fabf0e59d9ba78d83bd05e2f5438\"}', NULL, 1),
(10465, 2040, 1, NULL, 'literal', NULL, NULL, 'Participation 2026-10-24T05-28-06-155Z-4fc2e2', NULL, 1),
(10466, 2040, 10, NULL, 'literal', NULL, NULL, 'ae2d2164-4a68-4318-a820-4ee7b9f546ac/participation_2026-10-24T05-28-06-155Z-4fc2e2.json', NULL, 1),
(10467, 2040, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10468, 2041, 1, NULL, 'literal', NULL, NULL, 'Configuration chaoticum-seminario – 2026-10-27T14:24:20.868Z', NULL, 1),
(10469, 2041, 4, NULL, 'literal', NULL, NULL, '{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"01D.13 : Design de l\'Intelligence | 13e Colloque International sur les sciences et technologies de la conception\",\n  \"description\": \"\",\n  \"programUrl\": \"https://01design13.sciencesconf.org/resource/page/id/1\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"611ff5e08bc8\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"611ff5e08bc8\"\n  },\n  \"runId\": \"073225ae-3292-426e-a84a-02469d5764d1\",\n  \"startedAt\": \"2026-10-27T14:24:20.868Z\"\n}', NULL, 1),
(10470, 2041, 8, NULL, 'literal', NULL, NULL, 'Configuration de workflow', NULL, 1),
(10471, 2041, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1', NULL, 1),
(10472, 2041, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:24:20.868Z', NULL, 1),
(10473, 2041, 257, NULL, 'literal', NULL, NULL, 'success', NULL, 1),
(10474, 2041, 251, NULL, 'literal', NULL, NULL, '2026-10-27T14:24:20.868Z', NULL, 1),
(10475, 2041, 252, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:37.610Z', NULL, 1),
(10476, 2041, 250, NULL, 'literal', NULL, NULL, '{\"tokens\":{\"calls\":34,\"input\":32378,\"output\":4662,\"total\":37040},\"impact\":{\"energyWh\":0.44574819047619046,\"co2g\":0.014263942095238095,\"electricityCost\":0.0000891496380952381,\"apiCost\":0.007552120000000002,\"currency\":\"€\"}}', NULL, 1),
(10477, 2042, 1, NULL, 'literal', NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10478, 2042, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10479, 2042, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/partition.json', NULL, 1),
(10480, 2042, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10481, 2043, 1, NULL, 'literal', NULL, NULL, 'Rapport de la partition – 2026-10-27T14:26:38.245Z', NULL, 1),
(10482, 2043, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10483, 2043, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/rapport_chaoticum.md', NULL, 1),
(10484, 2043, 9, NULL, 'literal', NULL, NULL, 'text/markdown', NULL, 1),
(10485, 2044, 1, NULL, 'literal', NULL, NULL, 'Diapo ValPedArNum 15 (écran 2) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10486, 2044, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10487, 2044, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_02.png', NULL, 1),
(10488, 2044, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10489, 2045, 1, NULL, 'literal', NULL, NULL, 'Diapo iotLabs_2018 2 (écran 6) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10490, 2045, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10491, 2045, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_06.png', NULL, 1),
(10492, 2045, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10493, 2046, 1, NULL, 'literal', NULL, NULL, 'Diapo ia-iv-humain-2026 2 (écran 10) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10494, 2046, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10495, 2046, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_10.png', NULL, 1),
(10496, 2046, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10497, 2047, 1, NULL, 'literal', NULL, NULL, 'Diapo 01Design8 19 (écran 14) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10498, 2047, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10499, 2047, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_14.png', NULL, 1),
(10500, 2047, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10501, 2048, 1, NULL, 'literal', NULL, NULL, 'Diapo NDIDO2017 17 (écran 18) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10502, 2048, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10503, 2048, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_18.png', NULL, 1),
(10504, 2048, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10505, 2049, 1, NULL, 'literal', NULL, NULL, 'Diapo PEPE_2019 14 (écran 22) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10506, 2049, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10507, 2049, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_22.png', NULL, 1),
(10508, 2049, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10509, 2050, 1, NULL, 'literal', NULL, NULL, 'Diapo seminaireEHESS_2015 25 (écran 26) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10510, 2050, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10511, 2050, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_26.png', NULL, 1),
(10512, 2050, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10513, 2051, 1, NULL, 'literal', NULL, NULL, 'Diapo sqet_2019 21 (écran 30) – 2026-10-27T14:26:38.245Z', NULL, 1),
(10514, 2051, 7, NULL, 'literal', NULL, NULL, '2026-10-27T14:26:38.245Z', NULL, 1),
(10515, 2051, 10, NULL, 'literal', NULL, NULL, '073225ae-3292-426e-a84a-02469d5764d1/diapo_30.png', NULL, 1),
(10516, 2051, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10517, 2052, 1, NULL, 'literal', NULL, NULL, 'Configuration chaoticum-seminario – 2026-11-02T15:38:20.002Z', NULL, 1),
(10518, 2052, 4, NULL, 'literal', NULL, NULL, '{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"01D.13 : Design de l\'Intelligence | 13e Colloque International sur les sciences et technologies de la conception\",\n  \"description\": \"\",\n  \"programUrl\": \"https://01design13.sciencesconf.org/resource/page/id/1\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 30,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\",\n    \"contribution\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"11b63a1622c7\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"11b63a1622c7\"\n  },\n  \"runId\": \"121db903-b30c-4297-8900-65c8f01dce89\",\n  \"startedAt\": \"2026-11-02T15:38:20.002Z\"\n}', NULL, 1),
(10519, 2052, 8, NULL, 'literal', NULL, NULL, 'Configuration de workflow', NULL, 1),
(10520, 2052, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89', NULL, 1),
(10521, 2052, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:38:20.002Z', NULL, 1),
(10522, 2052, 257, NULL, 'literal', NULL, NULL, 'success', NULL, 1),
(10523, 2052, 251, NULL, 'literal', NULL, NULL, '2026-11-02T15:38:20.002Z', NULL, 1),
(10524, 2052, 252, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.279Z', NULL, 1),
(10525, 2052, 250, NULL, 'literal', NULL, NULL, '{\"tokens\":{\"calls\":25,\"input\":23118,\"output\":3427,\"total\":26545},\"impact\":{\"energyWh\":0.3191935,\"co2g\":0.010214192,\"electricityCost\":0.0000638387,\"apiCost\":0.00548316,\"currency\":\"€\"}}', NULL, 1),
(10526, 2053, 1, NULL, 'literal', NULL, NULL, 'Partition chaoticumSeminario (données) – 2026-11-02T15:39:38.915Z', NULL, 1),
(10527, 2053, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10528, 2053, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/partition.json', NULL, 1),
(10529, 2053, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10530, 2054, 1, NULL, 'literal', NULL, NULL, 'Rapport de la partition – 2026-11-02T15:39:38.915Z', NULL, 1),
(10531, 2054, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10532, 2054, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/rapport_chaoticum.md', NULL, 1),
(10533, 2054, 9, NULL, 'literal', NULL, NULL, 'text/markdown', NULL, 1),
(10534, 2055, 1, NULL, 'literal', NULL, NULL, 'Diapo ValPedArNum 15 (écran 2) – 2026-11-02T15:39:38.915Z', NULL, 1),
(10535, 2055, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10536, 2055, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/diapo_02.png', NULL, 1),
(10537, 2055, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10538, 2056, 1, NULL, 'literal', NULL, NULL, 'Diapo HumanAtHome 3 (écran 7) – 2026-11-02T15:39:38.915Z', NULL, 1),
(10539, 2056, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10540, 2056, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/diapo_07.png', NULL, 1),
(10541, 2056, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10542, 2057, 1, NULL, 'literal', NULL, NULL, 'Diapo software_digital-humanitiesII 16 (écran 12) – 2026-11-02T15:39:38.915Z', NULL, 1),
(10543, 2057, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10544, 2057, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/diapo_12.png', NULL, 1),
(10545, 2057, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10546, 2058, 1, NULL, 'literal', NULL, NULL, 'Diapo hyperurbain5 7 (écran 17) – 2026-11-02T15:39:38.915Z', NULL, 1),
(10547, 2058, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10548, 2058, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/diapo_17.png', NULL, 1),
(10549, 2058, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10550, 2059, 1, NULL, 'literal', NULL, NULL, 'Diapo software_digital-humanitiesII 25 (écran 22) – 2026-11-02T15:39:38.915Z', NULL, 1),
(10551, 2059, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10552, 2059, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/diapo_22.png', NULL, 1),
(10553, 2059, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10554, 2060, 1, NULL, 'literal', NULL, NULL, 'Diapo sqet_2019 17 (écran 27) – 2026-11-02T15:39:38.915Z', NULL, 1),
(10555, 2060, 7, NULL, 'literal', NULL, NULL, '2026-11-02T15:39:38.915Z', NULL, 1),
(10556, 2060, 10, NULL, 'literal', NULL, NULL, '121db903-b30c-4297-8900-65c8f01dce89/diapo_27.png', NULL, 1),
(10557, 2060, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10558, 2061, 1, NULL, 'literal', NULL, NULL, 'Configuration chaoticum-seminario – 2026-11-20T05:52:09.552Z', NULL, 1),
(10559, 2061, 4, NULL, 'literal', NULL, NULL, '{\n  \"workflowId\": \"chaoticum-seminario\",\n  \"title\": \"Université Paris 8 Formation IA 2026 - 2027\",\n  \"description\": \"Séance 4 : Atelier pratique d’analyse critique des productions et des usages de l’IA\\nA destination des personnels de l\'université Paris 8 : enseignants chercheurs, administratifs, directions, techniciens.\\nCette conférence a pour objectif de montrer les pratiques et les méthodes pour définir les frontières des productions et des usages de l’IA par une analyse critique dans les 3 écologies : environnement (la biosphère extérieure), rapports sociaux (les relations économiques, urbaines et politiques), subjectivité humaine\",\n  \"programUrl\": \"\",\n  \"selection\": {\n    \"byTheme\": true,\n    \"citationCandidates\": 40,\n    \"slideShortlist\": 12\n  },\n  \"rag\": {\n    \"enabled\": true,\n    \"slidesCollection\": \"chaoticum-diapos\",\n    \"zoteroCollection\": \"chaoticum-bibliotheque\",\n    \"slidesPerRun\": 150,\n    \"keywordsWeight\": 3,\n    \"notesWeight\": 2,\n    \"searchLimit\": 10,\n    \"chunkSize\": 2048,\n    \"chunkOverlap\": 200\n  },\n  \"screens\": 30,\n  \"durationMinutes\": 60,\n  \"pattern\": [\n    \"citation\",\n    \"diapo\",\n    \"diagramme\",\n    \"question\",\n    \"contribution\"\n  ],\n  \"weights\": {\n    \"citation\": 1,\n    \"diapo\": 1,\n    \"question\": 1.5,\n    \"contribution\": 2,\n    \"diagramme\": 1.5\n  },\n  \"seed\": \"bdc3520f7a28\",\n  \"timer\": {\n    \"warning\": 1,\n    \"danger\": 1.25\n  },\n  \"citations\": {\n    \"scope\": \"library\",\n    \"collection\": \"M9JEPJMI\",\n    \"includeNotes\": true,\n    \"minLength\": 40,\n    \"maxLength\": 700,\n    \"sources\": [\n      \"zotero\",\n      \"diigo\"\n    ]\n  },\n  \"diigo\": {\n    \"apiUrl\": \"https://samszo.humanum-p8.fr/api\",\n    \"itemSetId\": 1,\n    \"highlightTemplateId\": 13,\n    \"collection\": \"chaoticum-diigo\",\n    \"indexMedia\": true,\n    \"mediaMaxChars\": 100000,\n    \"indexImages\": true,\n    \"visionModel\": \"mistralai/Mistral-Small-3.2-24B-Instruct-2506\",\n    \"perRun\": 1000\n  },\n  \"slides\": {\n    \"siteUrl\": \"https://samszo.github.io/ConfErrance/\",\n    \"localDir\": \"\",\n    \"repo\": \"samszo/ConfErrance\",\n    \"docsPath\": \"docs\",\n    \"exclude\": [],\n    \"viewport\": {\n      \"width\": 1280,\n      \"height\": 720\n    },\n    \"settleMs\": 3000\n  },\n  \"grist\": {\n    \"formUrl\": \"https://grist.numerique.gouv.fr/o/docs/forms/mb9TqzGM4Y83V6GmpLMBGF/8\",\n    \"responsesUrl\": \"https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=FormationIA_23112026\",\n    \"urlColumn\": \"url\",\n    \"nameColumn\": \"nom\",\n    \"dateColumn\": \"date\",\n    \"pollSeconds\": 10,\n    \"moderation\": true\n  },\n  \"models\": {\n    \"vision\": \"mistralai/Ministral-3-8B-Instruct-2512\",\n    \"analytics\": \"openai/gpt-oss-120b\"\n  },\n  \"transcription\": {\n    \"engine\": \"albert\",\n    \"model\": \"whisper-large-v3\",\n    \"language\": \"fr\",\n    \"chunkSeconds\": 15,\n    \"silenceLevel\": 0.02,\n    \"captions\": true\n  },\n  \"annotation\": {\n    \"grid\": [\n      {\n        \"color\": \"#ffd400\",\n        \"name\": \"jaune\",\n        \"position\": \"Idée clé\",\n        \"instruction\": \"Passage central pour comprendre le document.\"\n      },\n      {\n        \"color\": \"#5fb236\",\n        \"name\": \"vert\",\n        \"position\": \"Accord\",\n        \"instruction\": \"Idée que je partage ou que je souhaite reprendre.\"\n      },\n      {\n        \"color\": \"#ff6666\",\n        \"name\": \"rouge\",\n        \"position\": \"Désaccord\",\n        \"instruction\": \"Affirmation que je conteste ou qui me pose problème.\"\n      },\n      {\n        \"color\": \"#2ea8e5\",\n        \"name\": \"bleu\",\n        \"position\": \"Définition\",\n        \"instruction\": \"Définition d\'un concept ou d\'un terme.\"\n      },\n      {\n        \"color\": \"#a28ae5\",\n        \"name\": \"violet\",\n        \"position\": \"Méthode\",\n        \"instruction\": \"Méthode, protocole ou démarche de recherche.\"\n      },\n      {\n        \"color\": \"#e56eee\",\n        \"name\": \"magenta\",\n        \"position\": \"Question\",\n        \"instruction\": \"Point à discuter en groupe, question ouverte.\"\n      },\n      {\n        \"color\": \"#f19837\",\n        \"name\": \"orange\",\n        \"position\": \"Exemple\",\n        \"instruction\": \"Exemple, cas, terrain d\'étude.\"\n      },\n      {\n        \"color\": \"#aaaaaa\",\n        \"name\": \"gris\",\n        \"position\": \"Contexte\",\n        \"instruction\": \"Élément de contexte, information secondaire.\"\n      }\n    ]\n  },\n  \"omeka\": {\n    \"participationClass\": \"bibo:Performance\",\n    \"participationType\": \"Participation chaoticumSeminario\"\n  },\n  \"outputDir\": \"resultats/chaoticum\",\n  \"input\": {\n    \"zoteroCollection\": \"\",\n    \"seed\": \"bdc3520f7a28\"\n  },\n  \"runId\": \"e9d8a1c7-048f-4720-810e-ad556a86c01a\",\n  \"startedAt\": \"2026-11-20T05:52:09.552Z\"\n}', NULL, 1),
(10560, 2061, 8, NULL, 'literal', NULL, NULL, 'Configuration de workflow', NULL, 1),
(10561, 2061, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a', NULL, 1),
(10562, 2061, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:52:09.552Z', NULL, 1),
(10563, 2061, 257, NULL, 'literal', NULL, NULL, 'success', NULL, 1),
(10564, 2061, 251, NULL, 'literal', NULL, NULL, '2026-11-20T05:52:09.552Z', NULL, 1),
(10565, 2061, 252, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.009Z', NULL, 1),
(10566, 2061, 250, NULL, 'literal', NULL, NULL, '{\"tokens\":{\"calls\":25,\"input\":19623,\"output\":6804,\"total\":26427},\"impact\":{\"energyWh\":0.3174047142857143,\"co2g\":0.010156950857142858,\"electricityCost\":0.00006348094285714286,\"apiCost\":0.006980489999999999,\"currency\":\"€\"}}', NULL, 1),
(10571, 2063, 1, NULL, 'literal', NULL, NULL, 'Rapport de la partition – 2026-11-20T05:54:53.641Z', NULL, 1),
(10572, 2063, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.641Z', NULL, 1),
(10573, 2063, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/rapport_chaoticum.md', NULL, 1),
(10574, 2063, 9, NULL, 'literal', NULL, NULL, 'text/markdown', NULL, 1),
(10575, 2064, 1, NULL, 'literal', NULL, NULL, 'Diapo je-creationParis8 1 (écran 2) – 2026-11-20T05:54:53.641Z', NULL, 1),
(10576, 2064, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.641Z', NULL, 1),
(10577, 2064, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_02.png', NULL, 1),
(10578, 2064, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10579, 2065, 1, NULL, 'literal', NULL, NULL, 'Diapo software_digital-humanitiesII 3 (écran 7) – 2026-11-20T05:54:53.641Z', NULL, 1),
(10580, 2065, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.641Z', NULL, 1),
(10581, 2065, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_07.png', NULL, 1),
(10582, 2065, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10583, 2066, 1, NULL, 'literal', NULL, NULL, 'Diapo je-creationParis8 8 (écran 12) – 2026-11-20T05:54:53.641Z', NULL, 1),
(10584, 2066, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.641Z', NULL, 1),
(10585, 2066, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_12.png', NULL, 1),
(10586, 2066, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10587, 2067, 1, NULL, 'literal', NULL, NULL, 'Diapo MIND_2020 1 (écran 17) – 2026-11-20T05:54:53.641Z', NULL, 1),
(10588, 2067, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.641Z', NULL, 1),
(10589, 2067, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_17.png', NULL, 1),
(10590, 2067, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10591, 2068, 1, NULL, 'literal', NULL, NULL, 'Diapo software_digital-humanitiesII 32 (écran 22) – 2026-11-20T05:54:53.641Z', NULL, 1),
(10592, 2068, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.641Z', NULL, 1),
(10593, 2068, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_22.png', NULL, 1),
(10594, 2068, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10595, 2069, 1, NULL, 'literal', NULL, NULL, 'Diapo repyramidage 9 (écran 27) – 2026-11-20T05:54:53.641Z', NULL, 1),
(10596, 2069, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:54:53.641Z', NULL, 1),
(10597, 2069, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_27.png', NULL, 1),
(10598, 2069, 9, NULL, 'literal', NULL, NULL, 'image/png', NULL, 1),
(10607, 2072, 1, NULL, 'literal', NULL, NULL, 'Copie d\'écran diapo_emwol28ka.png (éditeur)', NULL, 1),
(10608, 2072, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwol28ka.png', NULL, 1);
INSERT INTO `value` (`id`, `resource_id`, `property_id`, `value_resource_id`, `type`, `lang`, `value_annotation_id`, `value`, `uri`, `is_public`) VALUES
(10617, 2075, 1, NULL, 'literal', NULL, NULL, 'Copie d\'écran diapo_emwol8o9k.png (éditeur)', NULL, 1),
(10618, 2075, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwol8o9k.png', NULL, 1),
(10627, 2078, 1, NULL, 'literal', NULL, NULL, 'Copie d\'écran diapo_emwolev3w.png (éditeur)', NULL, 1),
(10628, 2078, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolev3w.png', NULL, 1),
(10641, 2082, 1, NULL, 'literal', NULL, NULL, 'Copie d\'écran diapo_emwolprtx.png (éditeur)', NULL, 1),
(10642, 2082, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolprtx.png', NULL, 1),
(10651, 2085, 1, NULL, 'literal', NULL, NULL, 'Copie d\'écran diapo_emwolrudh.png (éditeur)', NULL, 1),
(10652, 2085, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolrudh.png', NULL, 1),
(10657, 2087, 1, NULL, 'literal', NULL, NULL, 'Copie d\'écran diapo_emwolxnsc.png (éditeur)', NULL, 1),
(10658, 2087, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwolxnsc.png', NULL, 1),
(10675, 2092, 1, NULL, 'literal', NULL, NULL, 'Copie d\'écran diapo_emwomy1e2.png (éditeur)', NULL, 1),
(10676, 2092, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/diapo_emwomy1e2.png', NULL, 1),
(10789, 2121, 1, NULL, 'literal', NULL, NULL, 'Partition chaoticumSeminario (données) – modifiée le 2026-11-20T09:13:07.120Z', NULL, 1),
(10790, 2121, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/partition.json', NULL, 1),
(10791, 2121, 7, NULL, 'literal', NULL, NULL, '2026-11-20T09:13:07.120Z', NULL, 1),
(10792, 2121, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1),
(10793, 2122, 1, NULL, 'literal', NULL, NULL, 'Participation – Université Paris 8 Formation IA 2026 - 2027 – 20/11/2026 06:58:25', NULL, 1),
(10794, 2122, 8, NULL, 'literal', NULL, NULL, 'Participation chaoticumSeminario', NULL, 1),
(10795, 2122, 10, NULL, 'literal', NULL, NULL, '2026-11-20T09-19-19-804Z-52aa24', NULL, 1),
(10796, 2122, 7, NULL, 'literal', NULL, NULL, '2026-11-20T05:58:25.319Z', NULL, 1),
(10797, 2122, 4, NULL, 'literal', NULL, NULL, 'Séance du 20/11/2026 06:58:25 (en direct) : 69 passage(s) d\'écran, 201 min, 1 contribution(s), 4 écran(s) très dépassé(s).', NULL, 1),
(10798, 2122, 13, 2061, 'resource', NULL, NULL, NULL, NULL, 1),
(10799, 2122, 250, NULL, 'literal', NULL, NULL, '{\"runId\":\"e9d8a1c7-048f-4720-810e-ad556a86c01a\",\"mode\":\"live\",\"elapsedSeconds\":12054,\"events\":69,\"contributions\":1,\"share\":\"124039ca87ff95817796739be9cf5b73\"}', NULL, 1),
(10800, 2123, 1, NULL, 'literal', NULL, NULL, 'Participation 2026-11-20T09-19-19-804Z-52aa24', NULL, 1),
(10801, 2123, 10, NULL, 'literal', NULL, NULL, 'e9d8a1c7-048f-4720-810e-ad556a86c01a/participation_2026-11-20T09-19-19-804Z-52aa24.json', NULL, 1),
(10802, 2123, 9, NULL, 'literal', NULL, NULL, 'application/json', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `value_annotation`
--

CREATE TABLE `value_annotation` (
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `vocabulary`
--

CREATE TABLE `vocabulary` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `namespace_uri` varchar(190) NOT NULL,
  `prefix` varchar(190) NOT NULL,
  `label` varchar(255) NOT NULL,
  `comment` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vocabulary`
--

INSERT INTO `vocabulary` (`id`, `owner_id`, `namespace_uri`, `prefix`, `label`, `comment`) VALUES
(1, NULL, 'http://purl.org/dc/terms/', 'dcterms', 'Dublin Core', 'Basic resource metadata (DCMI Metadata Terms)'),
(2, NULL, 'http://purl.org/dc/dcmitype/', 'dctype', 'Dublin Core Type', 'Basic resource types (DCMI Type Vocabulary)'),
(3, NULL, 'http://purl.org/ontology/bibo/', 'bibo', 'Bibliographic Ontology', 'Bibliographic metadata (BIBO)'),
(4, NULL, 'http://xmlns.com/foaf/0.1/', 'foaf', 'Friend of a Friend', 'Relationships between people and organizations (FOAF)'),
(5, NULL, 'https://jardindesconnaissances.univ-paris8.fr/onto/jdc#', 'jdc', 'Jardin des connaissances', ''),
(6, NULL, 'http://www.w3.org/2004/02/skos/core#', 'skos', 'SKOS', ''),
(7, NULL, 'https://omeka.org/s/vocabs/curation/', 'curation', 'curation', 'Generic and common properties that are useful in Omeka for the curation of resources. The use of more common or more precise ontologies is recommended when it is possible.'),
(8, NULL, 'http://www.w3.org/ns/oa#', 'oa', 'Web Annotation Ontology', 'The Web Annotation Vocabulary specifies the set of RDF classes, predicates and named entities that are used by the Web Annotation Data Model (http://www.w3.org/TR/annotation-model/).'),
(9, NULL, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', 'rdf', 'The RDF Concepts Vocabulary (RDF)', 'This is the RDF Schema for the RDF vocabulary terms in the RDF Namespace, defined in RDF 1.1 Concepts.');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `annotation`
--
ALTER TABLE `annotation`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `annotation_value`
--
ALTER TABLE `annotation_value`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_annotation_value_parts` (`annotation_id`,`field`,`ordinal`);

--
-- Index pour la table `api_key`
--
ALTER TABLE `api_key`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_C912ED9D7E3C61F9` (`owner_id`);

--
-- Index pour la table `asset`
--
ALTER TABLE `asset`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_2AF5A5C5CC5DB90` (`storage_id`),
  ADD KEY `IDX_2AF5A5C7E3C61F9` (`owner_id`);

--
-- Index pour la table `custom_vocab`
--
ALTER TABLE `custom_vocab`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_8533D2A5EA750E8` (`label`),
  ADD KEY `IDX_8533D2A5960278D7` (`item_set_id`),
  ADD KEY `IDX_8533D2A57E3C61F9` (`owner_id`);

--
-- Index pour la table `fulltext_search`
--
ALTER TABLE `fulltext_search`
  ADD PRIMARY KEY (`id`,`resource`),
  ADD KEY `IDX_AA31FE4A7E3C61F9` (`owner_id`),
  ADD KEY `is_public` (`is_public`);
ALTER TABLE `fulltext_search` ADD FULLTEXT KEY `IDX_AA31FE4A2B36786B3B8BA7C7` (`title`,`text`);

--
-- Index pour la table `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_1F1B251ECBE0B084` (`primary_media_id`);

--
-- Index pour la table `item_item_set`
--
ALTER TABLE `item_item_set`
  ADD PRIMARY KEY (`item_id`,`item_set_id`),
  ADD KEY `IDX_6D0C9625126F525E` (`item_id`),
  ADD KEY `IDX_6D0C9625960278D7` (`item_set_id`);

--
-- Index pour la table `item_set`
--
ALTER TABLE `item_set`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `item_site`
--
ALTER TABLE `item_site`
  ADD PRIMARY KEY (`item_id`,`site_id`),
  ADD KEY `IDX_A1734D1F126F525E` (`item_id`),
  ADD KEY `IDX_A1734D1FF6BD1646` (`site_id`),
  ADD KEY `idx_site_item` (`site_id`,`item_id`);

--
-- Index pour la table `job`
--
ALTER TABLE `job`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_FBD8E0F87E3C61F9` (`owner_id`);

--
-- Index pour la table `log`
--
ALTER TABLE `log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_8F3F68C57E3C61F9` (`owner_id`),
  ADD KEY `IDX_8F3F68C5BE04EA9` (`job_id`),
  ADD KEY `IDX_8F3F68C5AEA34913` (`reference`),
  ADD KEY `IDX_8F3F68C5F660D16B` (`severity`),
  ADD KEY `IDX_8F3F68C5B23DB7B8` (`created`);

--
-- Index pour la table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_6A2CA10C5CC5DB90` (`storage_id`),
  ADD KEY `IDX_6A2CA10C126F525E` (`item_id`),
  ADD KEY `item_position` (`item_id`,`position`),
  ADD KEY `media_type` (`media_type`),
  ADD KEY `ingester` (`ingester`),
  ADD KEY `renderer` (`renderer`),
  ADD KEY `extension` (`extension`);

--
-- Index pour la table `migration`
--
ALTER TABLE `migration`
  ADD PRIMARY KEY (`version`);

--
-- Index pour la table `module`
--
ALTER TABLE `module`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `password_creation`
--
ALTER TABLE `password_creation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_C77917B4A76ED395` (`user_id`);

--
-- Index pour la table `property`
--
ALTER TABLE `property`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_8BF21CDEAD0E05F6623C14D5` (`vocabulary_id`,`local_name`),
  ADD KEY `IDX_8BF21CDE7E3C61F9` (`owner_id`),
  ADD KEY `IDX_8BF21CDEAD0E05F6` (`vocabulary_id`);

--
-- Index pour la table `resource`
--
ALTER TABLE `resource`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_BC91F4167E3C61F9` (`owner_id`),
  ADD KEY `IDX_BC91F416448CC1BD` (`resource_class_id`),
  ADD KEY `IDX_BC91F41616131EA` (`resource_template_id`),
  ADD KEY `IDX_BC91F416FDFF2E92` (`thumbnail_id`),
  ADD KEY `title` (`title`(190)),
  ADD KEY `is_public` (`is_public`),
  ADD KEY `resource_type` (`resource_type`),
  ADD KEY `idx_type_created` (`resource_type`,`created`),
  ADD KEY `idx_type_modified` (`resource_type`,`modified`);

--
-- Index pour la table `resource_class`
--
ALTER TABLE `resource_class`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_C6F063ADAD0E05F6623C14D5` (`vocabulary_id`,`local_name`),
  ADD KEY `IDX_C6F063AD7E3C61F9` (`owner_id`),
  ADD KEY `IDX_C6F063ADAD0E05F6` (`vocabulary_id`);

--
-- Index pour la table `resource_template`
--
ALTER TABLE `resource_template`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_39ECD52EEA750E8` (`label`),
  ADD KEY `IDX_39ECD52E7E3C61F9` (`owner_id`),
  ADD KEY `IDX_39ECD52E448CC1BD` (`resource_class_id`),
  ADD KEY `IDX_39ECD52E724734A3` (`title_property_id`),
  ADD KEY `IDX_39ECD52EB84E0D1D` (`description_property_id`);

--
-- Index pour la table `resource_template_property`
--
ALTER TABLE `resource_template_property`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_4689E2F116131EA549213EC` (`resource_template_id`,`property_id`),
  ADD KEY `IDX_4689E2F116131EA` (`resource_template_id`),
  ADD KEY `IDX_4689E2F1549213EC` (`property_id`);

--
-- Index pour la table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`id`),
  ADD KEY `modified` (`modified`);

--
-- Index pour la table `setting`
--
ALTER TABLE `setting`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `site`
--
ALTER TABLE `site`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_694309E4989D9B62` (`slug`),
  ADD UNIQUE KEY `UNIQ_694309E4571EDDA` (`homepage_id`),
  ADD KEY `IDX_694309E4FDFF2E92` (`thumbnail_id`),
  ADD KEY `IDX_694309E47E3C61F9` (`owner_id`);

--
-- Index pour la table `site_block_attachment`
--
ALTER TABLE `site_block_attachment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_236473FEE9ED820C` (`block_id`),
  ADD KEY `IDX_236473FE126F525E` (`item_id`),
  ADD KEY `IDX_236473FEEA9FDD75` (`media_id`),
  ADD KEY `block_position` (`block_id`,`position`);

--
-- Index pour la table `site_item_set`
--
ALTER TABLE `site_item_set`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_D4CE134F6BD1646960278D7` (`site_id`,`item_set_id`),
  ADD KEY `IDX_D4CE134F6BD1646` (`site_id`),
  ADD KEY `IDX_D4CE134960278D7` (`item_set_id`),
  ADD KEY `position` (`position`);

--
-- Index pour la table `site_page`
--
ALTER TABLE `site_page`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_2F900BD9F6BD1646989D9B62` (`site_id`,`slug`),
  ADD KEY `is_public` (`is_public`),
  ADD KEY `IDX_2F900BD9F6BD1646` (`site_id`);

--
-- Index pour la table `site_page_block`
--
ALTER TABLE `site_page_block`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_C593E731C4663E4` (`page_id`),
  ADD KEY `page_position` (`page_id`,`position`);

--
-- Index pour la table `site_permission`
--
ALTER TABLE `site_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_C0401D6FF6BD1646A76ED395` (`site_id`,`user_id`),
  ADD KEY `IDX_C0401D6FF6BD1646` (`site_id`),
  ADD KEY `IDX_C0401D6FA76ED395` (`user_id`);

--
-- Index pour la table `site_setting`
--
ALTER TABLE `site_setting`
  ADD PRIMARY KEY (`id`,`site_id`),
  ADD KEY `IDX_64D05A53F6BD1646` (`site_id`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_8D93D649E7927C74` (`email`);

--
-- Index pour la table `user_setting`
--
ALTER TABLE `user_setting`
  ADD PRIMARY KEY (`id`,`user_id`),
  ADD KEY `IDX_C779A692A76ED395` (`user_id`);

--
-- Index pour la table `value`
--
ALTER TABLE `value`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_1D7758349B66727E` (`value_annotation_id`),
  ADD KEY `IDX_1D77583489329D25` (`resource_id`),
  ADD KEY `IDX_1D775834549213EC` (`property_id`),
  ADD KEY `IDX_1D7758344BC72506` (`value_resource_id`),
  ADD KEY `value` (`value`(190)),
  ADD KEY `uri` (`uri`(190)),
  ADD KEY `is_public` (`is_public`),
  ADD KEY `type` (`type`),
  ADD KEY `lang` (`lang`),
  ADD KEY `idx_property_value` (`property_id`,`value`(190)),
  ADD KEY `idx_property_value_resource` (`property_id`,`value_resource_id`);

--
-- Index pour la table `value_annotation`
--
ALTER TABLE `value_annotation`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `vocabulary`
--
ALTER TABLE `vocabulary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_9099C97B9B267FDF` (`namespace_uri`),
  ADD UNIQUE KEY `UNIQ_9099C97B93B1868E` (`prefix`),
  ADD KEY `IDX_9099C97B7E3C61F9` (`owner_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `asset`
--
ALTER TABLE `asset`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `custom_vocab`
--
ALTER TABLE `custom_vocab`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `job`
--
ALTER TABLE `job`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `log`
--
ALTER TABLE `log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=177;

--
-- AUTO_INCREMENT pour la table `property`
--
ALTER TABLE `property`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=294;

--
-- AUTO_INCREMENT pour la table `resource`
--
ALTER TABLE `resource`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2124;

--
-- AUTO_INCREMENT pour la table `resource_class`
--
ALTER TABLE `resource_class`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;

--
-- AUTO_INCREMENT pour la table `resource_template`
--
ALTER TABLE `resource_template`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `resource_template_property`
--
ALTER TABLE `resource_template_property`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT pour la table `site`
--
ALTER TABLE `site`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `site_block_attachment`
--
ALTER TABLE `site_block_attachment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `site_item_set`
--
ALTER TABLE `site_item_set`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `site_page`
--
ALTER TABLE `site_page`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `site_page_block`
--
ALTER TABLE `site_page_block`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `site_permission`
--
ALTER TABLE `site_permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `value`
--
ALTER TABLE `value`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10803;

--
-- AUTO_INCREMENT pour la table `vocabulary`
--
ALTER TABLE `vocabulary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `annotation`
--
ALTER TABLE `annotation`
  ADD CONSTRAINT `FK_2E443EF2BF396750` FOREIGN KEY (`id`) REFERENCES `resource` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `annotation_value`
--
ALTER TABLE `annotation_value`
  ADD CONSTRAINT `FK_annotation_value_annotation` FOREIGN KEY (`annotation_id`) REFERENCES `annotation` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_annotation_value_value` FOREIGN KEY (`id`) REFERENCES `value` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `api_key`
--
ALTER TABLE `api_key`
  ADD CONSTRAINT `FK_C912ED9D7E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`);

--
-- Contraintes pour la table `asset`
--
ALTER TABLE `asset`
  ADD CONSTRAINT `FK_2AF5A5C7E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `custom_vocab`
--
ALTER TABLE `custom_vocab`
  ADD CONSTRAINT `FK_8533D2A57E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_8533D2A5960278D7` FOREIGN KEY (`item_set_id`) REFERENCES `item_set` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `fulltext_search`
--
ALTER TABLE `fulltext_search`
  ADD CONSTRAINT `FK_AA31FE4A7E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `item`
--
ALTER TABLE `item`
  ADD CONSTRAINT `FK_1F1B251EBF396750` FOREIGN KEY (`id`) REFERENCES `resource` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_1F1B251ECBE0B084` FOREIGN KEY (`primary_media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `item_item_set`
--
ALTER TABLE `item_item_set`
  ADD CONSTRAINT `FK_6D0C9625126F525E` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_6D0C9625960278D7` FOREIGN KEY (`item_set_id`) REFERENCES `item_set` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `item_set`
--
ALTER TABLE `item_set`
  ADD CONSTRAINT `FK_1015EEEBF396750` FOREIGN KEY (`id`) REFERENCES `resource` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `item_site`
--
ALTER TABLE `item_site`
  ADD CONSTRAINT `FK_A1734D1F126F525E` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A1734D1FF6BD1646` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `job`
--
ALTER TABLE `job`
  ADD CONSTRAINT `FK_FBD8E0F87E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `log`
--
ALTER TABLE `log`
  ADD CONSTRAINT `FK_8F3F68C57E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_8F3F68C5BE04EA9` FOREIGN KEY (`job_id`) REFERENCES `job` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `media`
--
ALTER TABLE `media`
  ADD CONSTRAINT `FK_6A2CA10C126F525E` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`),
  ADD CONSTRAINT `FK_6A2CA10CBF396750` FOREIGN KEY (`id`) REFERENCES `resource` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `password_creation`
--
ALTER TABLE `password_creation`
  ADD CONSTRAINT `FK_C77917B4A76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `property`
--
ALTER TABLE `property`
  ADD CONSTRAINT `FK_8BF21CDE7E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_8BF21CDEAD0E05F6` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary` (`id`);

--
-- Contraintes pour la table `resource`
--
ALTER TABLE `resource`
  ADD CONSTRAINT `FK_BC91F41616131EA` FOREIGN KEY (`resource_template_id`) REFERENCES `resource_template` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_BC91F416448CC1BD` FOREIGN KEY (`resource_class_id`) REFERENCES `resource_class` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_BC91F4167E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_BC91F416FDFF2E92` FOREIGN KEY (`thumbnail_id`) REFERENCES `asset` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `resource_class`
--
ALTER TABLE `resource_class`
  ADD CONSTRAINT `FK_C6F063AD7E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_C6F063ADAD0E05F6` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary` (`id`);

--
-- Contraintes pour la table `resource_template`
--
ALTER TABLE `resource_template`
  ADD CONSTRAINT `FK_39ECD52E448CC1BD` FOREIGN KEY (`resource_class_id`) REFERENCES `resource_class` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_39ECD52E724734A3` FOREIGN KEY (`title_property_id`) REFERENCES `property` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_39ECD52E7E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_39ECD52EB84E0D1D` FOREIGN KEY (`description_property_id`) REFERENCES `property` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `resource_template_property`
--
ALTER TABLE `resource_template_property`
  ADD CONSTRAINT `FK_4689E2F116131EA` FOREIGN KEY (`resource_template_id`) REFERENCES `resource_template` (`id`),
  ADD CONSTRAINT `FK_4689E2F1549213EC` FOREIGN KEY (`property_id`) REFERENCES `property` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `site`
--
ALTER TABLE `site`
  ADD CONSTRAINT `FK_694309E4571EDDA` FOREIGN KEY (`homepage_id`) REFERENCES `site_page` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_694309E47E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_694309E4FDFF2E92` FOREIGN KEY (`thumbnail_id`) REFERENCES `asset` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `site_block_attachment`
--
ALTER TABLE `site_block_attachment`
  ADD CONSTRAINT `FK_236473FE126F525E` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_236473FEE9ED820C` FOREIGN KEY (`block_id`) REFERENCES `site_page_block` (`id`),
  ADD CONSTRAINT `FK_236473FEEA9FDD75` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `site_item_set`
--
ALTER TABLE `site_item_set`
  ADD CONSTRAINT `FK_D4CE134960278D7` FOREIGN KEY (`item_set_id`) REFERENCES `item_set` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_D4CE134F6BD1646` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `site_page`
--
ALTER TABLE `site_page`
  ADD CONSTRAINT `FK_2F900BD9F6BD1646` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`);

--
-- Contraintes pour la table `site_page_block`
--
ALTER TABLE `site_page_block`
  ADD CONSTRAINT `FK_C593E731C4663E4` FOREIGN KEY (`page_id`) REFERENCES `site_page` (`id`);

--
-- Contraintes pour la table `site_permission`
--
ALTER TABLE `site_permission`
  ADD CONSTRAINT `FK_C0401D6FA76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_C0401D6FF6BD1646` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `site_setting`
--
ALTER TABLE `site_setting`
  ADD CONSTRAINT `FK_64D05A53F6BD1646` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_setting`
--
ALTER TABLE `user_setting`
  ADD CONSTRAINT `FK_C779A692A76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `value`
--
ALTER TABLE `value`
  ADD CONSTRAINT `FK_1D7758344BC72506` FOREIGN KEY (`value_resource_id`) REFERENCES `resource` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_1D775834549213EC` FOREIGN KEY (`property_id`) REFERENCES `property` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_1D77583489329D25` FOREIGN KEY (`resource_id`) REFERENCES `resource` (`id`),
  ADD CONSTRAINT `FK_1D7758349B66727E` FOREIGN KEY (`value_annotation_id`) REFERENCES `value_annotation` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `value_annotation`
--
ALTER TABLE `value_annotation`
  ADD CONSTRAINT `FK_C03BA4EBF396750` FOREIGN KEY (`id`) REFERENCES `resource` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `vocabulary`
--
ALTER TABLE `vocabulary`
  ADD CONSTRAINT `FK_9099C97B7E3C61F9` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

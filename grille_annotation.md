# Projet d'Annotation de Corpus pour l'IA : Typologie des Positionnements Argumentatifs

Ce document rassemble la typologie, le guide d'annotation officiel (codebook) et l'exercice de calibration pour les étudiants dans le cadre du cours universitaire.

---

## 1. La Typologie Générale des Postures

Face à un argument, cinq grands positionnements peuvent être adoptés :
1. **L’accord (L'adhésion) :** Validation simple, enrichissement par des preuves ou concession partielle.
2. **Le désaccord (La réfutation) :** Contre-argumentation logique, réduction à l'absurde ou contestation des faits de base.
3. **La neutralité :** Suspension de jugement par manque de données, relativisme contextuel ou reformulation objective.
4. **La mauvaise foi (Sophisme) :** Attaque ad hominem, caricature (épouvantail) ou diversion (hareng fumé).
5. **Le dépassement (Synthèse) :** Prise de hauteur ou problématisation d'un enjeu sous-jacent.

---

## 2. Grille d'Annotation (Codebook)

| Code | Posture | Sous-catégorie | Définition pour l'annotateur | Exemple textuel |
| :--- | :--- | :--- | :--- | :--- |
| **ACC-S** | **Accord** | Assentiment | Validation directe de l'argument sans valeur ajoutée. | *« C'est tout à fait exact. »* |
| **ACC-E** | | Expansion | Approbation enrichie par un nouvel exemple ou une preuve. | *« Je partage cet avis, d'autant que l'étude X le prouve. »* |
| **ACC-C** | | Concession | Acceptation d'un point avant d'introduire une nuance. | *« Certes, ce risque existe, mais... »* |
| **DES-F** | **Désaccord** | Factuel / Logique | Réfutation basée sur des faits, des chiffres ou une contre-logique. | *« C'est faux, car les statistiques montrent l'inverse. »* |
| **DES-A** | | Absurde | Extrapole l'argument pour en montrer l'incohérence. | *« Si on suit votre logique, il faudrait tout interdire. »* |
| **NEU-S** | **Neutralité** | Suspension | Refus de trancher par manque d'éléments ou objectivité stricte. | *« Les données actuelles ne permettent pas de conclure. »* |
| **NEU-R** | | Relativisation | Renvoi dos à dos des arguments selon le contexte. | *« Cela dépend fortement du cadre juridique choisi. »* |
| **RHET-H**| **Rhétorique** | *Ad hominem* | Attaque ciblant la crédibilité ou l'honnêteté de l'auteur. | *« Vous dites cela uniquement par intérêt politique. »* |
| **RHET-E**| (Mauvaise foi) | Épouvantail | Déformation flagrante de l'argument pour le caricaturer. | *« En voulant réguler, vous prônez la censure totale. »* |
| **DEP-S** | **Dépassement**| Synthèse | Fusion des positions ou reformulation dans un cadre plus large. | *« Ces deux visions s'expliquent si l'on change d'échelle... »* |

---

## 3. Guide de Consignes pour les Annotateurs

### Règle d'or et unité d'annotation
* **L'unité d'annotation est la phrase.** Si une phrase contient plusieurs positionnements imbriqués, appliquez la règle de la fonction dominante.
* **Objectivité stricte :** Vous devez annoter la posture logique du texte, et non votre opinion sur le sujet traité.

### Règles de décision prioritaires (Pour lever les ambiguïtés)
* **Règle "Certes... mais" (Concession vs Désaccord) :** Si la phrase commence par une concession mais bascule complètement dans le rejet de l'argument initial, elle doit être taguée **DES-F** (la fonction dominante est le désaccord).
* **Règle de l'Ironie :** Ne prenez pas les mots au premier degré si le ton est manifestement ironique. L'ironie visant à ridiculiser l'adversaire doit être taguée **RHET-E** (Épouvantail) ou **DES-A** (Absurde).
* **Règle du doute absolu (La catégorie AMB) :** Si une phrase est totalement incompréhensible ou si l'hésitation persiste entre deux codes, utilisez le code **AMB** (Ambigu).

### Fiabilité des données : Le Kappa de Cohen et de Fleiss
Pour garantir que l'IA s'entraîne sur des données stables, nous mesurons l'accord inter-juges.
* **Kappa de Cohen (κ) :** Utilisé pour analyser l'accord entre 2 annotateurs.
* **Kappa de Fleiss :** Utilisé pour analyser l'accord entre 3 annotateurs ou plus.
* **Objectif visé :** Un score Kappa situé entre **0,61 et 0,80 (Accord substantiel)** est requis pour valider le corpus d'entraînement.

---

## 4. Exercice Pratique de Calibration (Fiche Étudiant)

**Consigne :** Attribuez le code exact de la grille à chaque phrase et justifiez brièvement votre choix.

* **Phrase 1 :** « Il est indéniable que la réduction du temps de travail améliore le bien-être des salariés ; l'enquête de l'INSEE de 2024 montre d'ailleurs une baisse de 15% du stress chez les cadres concernés. »
  * Code : `ACC-E` (Accord - Expansion)
  * Justification : Validation directe appuyée par une preuve statistique externe.

* **Phrase 2 :** « Si l'on écoute les partisans de cette loi, il faudrait installer des caméras jusque dans nos salles de bain pour garantir une sécurité absolue. »
  * Code : `RHET-E` (Rhétorique - Épouvantail) ou `DES-A` (Désaccord - Absurde)
  * Justification : Caricature extrême de la position adverse pour la tourner en dérision.

* **Phrase 3 :** « Monsieur le Député défend cette réforme fiscale uniquement parce que ses propres entreprises vont en bénéficier, ce qui invalide totalement son plaidoyer. »
  * Code : `RHET-H` (Rhétorique - Ad hominem)
  * Justification : Attaque ciblée sur les intérêts personnels de l'orateur plutôt que sur le fond.

* **Phrase 4 :** « Bien que la transition énergétique nécessite des investissements massifs à court terme, elle reste la seule trajectoire viable pour stabiliser notre économie d'ici 2030. »
  * Code : `DES-F` (Désaccord - Factuel / Logique)
  * Justification : Malgré l'amorce concessive, la fonction principale est d'imposer une trajectoire contre l'avis critique.

* **Phrase 5 :** « Plutôt que de s'affronter sur le pour ou le contre du télétravail total, il convient d'analyser comment ce modèle redéfinit profondément la frontière entre vie privée et vie professionnelle. »
  * Code : `DEP-S` (Dépassement - Synthèse / Problématisation)
  * Justification : Refus du débat binaire et introduction d'un nouvel angle d'analyse plus large.

# Documentation utilisateur

L'écosystème d'agents propose deux applications, qui travaillent sur une **collection Zotero** annotée et archivent leurs résultats dans **Omeka S** :

| Application | Adresse | Quand l'utiliser | Section |
|---|---|---|---|
| **Atelier d'articles** | http://127.0.0.1:7272 | pour **répondre à un appel à propositions (AAP)** : analyse des attendus de l'appel, concepts de la collection, accord entre annotateurs, **proposition d'article** avec références, citations et mots-clés | 2 |
| **exploZoteroAnno** | http://127.0.0.1:7273 | pour **animer une annotation collective** : grille de couleurs commune, participation de chacun, convergences et divergences de lecture, thèmes de discussion | 3 |

### La page Paramètres (connexions)

Dans chaque application, le lien **⚙ Paramètres** de l'en-tête ouvre la page des **connexions** (adresse `/parametres`) : clé de l'API Albert, bibliothèque Zotero (clé, identifiant utilisateur, groupe), instance Omeka S (URL et clé d'API), port de l'interface.

- Les secrets ne sont jamais réaffichés : laisser le champ vide garde la valeur enregistrée.
- Pendant la saisie de la bibliothèque Zotero, la page indique la bibliothèque correspondante et son nombre de collections, avant même l'enregistrement.
- **Enregistrer et tester les connexions** vérifie Albert, Zotero et Omeka S (vocabulaires et droits de la clé).
- Dans exploZoteroAnno, les connexions sont par défaut **héritées** de celles de l'Atelier (mention « héritée de .env ») ; une valeur modifiée ne vaut que pour exploZoteroAnno (par exemple un autre groupe Zotero).
- De retour sur l'application, la liste des collections est rechargée.

Les deux applications sont indépendantes (chacune son serveur, ses réglages et son traitement en cours) mais complémentaires : un groupe peut annoter une collection avec exploZoteroAnno, puis s'appuyer sur ces annotations dans l'Atelier pour rédiger une proposition. Les documents, annotations et concepts enregistrés dans Omeka S sont partagés : un document déjà extrait par l'une n'est pas réextrait par l'autre. La préparation du corpus dans Zotero (section 1) vaut pour les deux.

Parcours de l'**Atelier d'articles** :

```mermaid
flowchart LR
    subgraph Préparer["1. Préparer (Zotero)"]
        Z1[Collection de documents] --> Z2[Surlignages en couleur,<br/>notes, marqueurs]
    end
    subgraph Paramétrer["2. Paramétrer (interface)"]
        P1[Collection Zotero] --> P2[Lien ou fichier de l'appel]
        P2 --> P3[Plan de la proposition]
    end
    subgraph Lancer["3. Lancer"]
        L1[Enregistrer et lancer] --> L2[Suivre le journal]
    end
    subgraph Exploiter["4. Exploiter"]
        E1[AttenduAPP] --> E2[PropAPP]
        E2 --> E3[Relecture, rapport,<br/>graphe, kappa]
    end
    Préparer --> Paramétrer --> Lancer --> Exploiter
```

## 1. Préparer le corpus dans Zotero

### La collection

Rassembler dans une collection Zotero les documents à mobiliser : articles, chapitres, pages web enregistrées, PDF, DOCX, ODT, EPUB, textes. Chaque **notice** Zotero fournit la référence bibliographique (BibTeX) de la proposition ; ses **pièces jointes** fournissent le texte analysé.

Pour un travail à plusieurs, utiliser une **bibliothèque de groupe** : chaque annotation y garde son auteur et sa date, ce qui permet l'accord inter-juges (Atelier) et le suivi de la participation (exploZoteroAnno). Si plusieurs membres ajoutent le même document, exploZoteroAnno le détecte et fusionne les exemplaires (voir section 3).

### Surligner avec une couleur qui indique votre positionnement

La couleur d'un surlignage indique votre position par rapport au passage. Elle oriente l'extraction des concepts et apparaît dans les citations de la proposition. La table par défaut reprend la palette de Zotero ; elle est modifiable dans **Paramètres › Positionnement par couleur** (Atelier d'articles). exploZoteroAnno a **sa propre grille** (onglet *Grille*), à partager avec le groupe : par défaut les mêmes couleurs, avec des libellés adaptés à la discussion (« Question » plutôt que « Question ouverte », par exemple).

| Couleur | Positionnement | Effet sur l'extraction |
|---|---|---|
| 🟨 jaune | Idée clé | concepts centraux, reliés entre eux |
| 🟩 vert | Accord | idées reprises : relations « soutient », « fonde », « prolonge » |
| 🟥 rouge | Désaccord | thèses contestées : relations « s'oppose à », « critique » |
| 🟦 bleu | Définition | concept défini et ses composantes |
| 🟪 violet | Méthode | méthodes et protocoles |
| 🟣 magenta | Question ouverte | questions à approfondir |
| 🟧 orange | Exemple | exemples, cas, terrains |
| ⬜ gris | Contexte | éléments secondaires |

Les annotations faites dans le lecteur Zotero et celles déjà présentes dans un PDF sont toutes les deux prises en compte.

### Notes et marqueurs

- Une **note** rattachée à une notice est traitée comme une annotation : c'est typiquement une citation (« … » § 15) accompagnée de votre commentaire. Le repère (§ 15, p. 12) est repris dans la citation.
- Un **marqueur** (tag) sur une notice, une pièce jointe, une note ou une annotation devient un **concept** : il apparaît dans le graphe, dans les mots-clés de la proposition et dans Omeka S. Les marqueurs listés dans *Marqueurs exclus des mots-clés* (par défaut `citation`) ne deviennent pas des mots-clés.

### Coder les phrases pour l'accord inter-juges

Pour mesurer l'accord entre plusieurs annotateurs (juges), chaque juge ajoute **comme marqueur** le code de la grille d'annotation (`grille_annotation.md`) sur la phrase annotée :

| Code | Positionnement argumentatif |
|---|---|
| `ACC-S`, `ACC-E`, `ACC-C` | Accord – assentiment, expansion, concession |
| `DES-F`, `DES-A` | Désaccord – factuel/logique, absurde |
| `NEU-S`, `NEU-R` | Neutralité – suspension, relativisation |
| `RHET-H`, `RHET-E` | Rhétorique – ad hominem, épouvantail |
| `DEP-S` | Dépassement – synthèse |
| `AMB` | Ambigu |

Les juges doivent travailler dans une **bibliothèque de groupe** Zotero : c'est ce qui permet de savoir qui a codé quoi. Les codes ne deviennent pas des concepts.

## 2. Atelier d'articles : utiliser l'interface

L'interface s'ouvre sur http://127.0.0.1:7272. Elle comporte quatre onglets : Configuration, Exécution, Résultats et Appels traités. Dans l'en-tête, **exploZoteroAnno** ouvre la seconde application et **⚙ Paramètres** la page des connexions.

### Configuration

| Section | Contenu |
|---|---|
| Données d'entrée | collection Zotero (liste déroulante), **lien vers l'appel**, **fichier de l'appel** (si le site bloque le téléchargement), texte ou précisions sur l'appel |
| Proposition d'article | **plan en markdown**, auteurs supplémentaires, nombre de mots-clés et de citations, style de citation |
| Modèles de langage | modèles Albert (suggestions chargées depuis l'API) |
| Extraction sémantique | taille des extraits de texte, lots de nettoyage |
| Zotero et marqueurs | marqueurs automatiques, catégorie des concepts issus des marqueurs |
| Positionnement par couleur | table couleur → positionnement → consigne pour le modèle |
| Accord inter-juges | codes de la grille, similarité de phrase, kappa requis |
| Omeka S (avancé) | vocabulaires, classes et propriétés utilisées |

**Enregistrer** écrit les modifications dans `.env` et `workflow.config.json` ; **Rétablir la configuration par défaut** revient aux valeurs de `config.ts`.

#### Le plan de la proposition

Le plan est un texte markdown : chaque titre devient une section de la proposition, les lignes `Consigne :` guident le rédacteur et ne figurent pas dans le texte final.

```markdown
# Titre de la proposition
Consigne : titre court et explicite, en lien direct avec l'appel.

## Résumé
Consigne : 250 mots maximum ; problématique, démarche, apports attendus.

## Cadre théorique
Consigne : mobiliser les concepts du graphe et les références de la collection, avec citations.
```

#### Quand le site de l'appel bloque le téléchargement

Certains sites (par exemple ceux protégés par Cloudflare) refusent les accès automatiques. Ouvrir la page dans le navigateur, l'enregistrer en PDF (*Imprimer › Enregistrer au format PDF*) ou en HTML, puis l'importer avec **Fichier de l'appel**. Le lien reste la source de l'appel dans Omeka S.

### Exécution

**Enregistrer et lancer** enregistre les paramètres et démarre le traitement. Le journal s'affiche en direct ; un traitement peut être **arrêté**. On peut fermer la page : le journal reprend à la réouverture.

```mermaid
stateDiagram-v2
    [*] --> Paramétré : Enregistrer
    Paramétré --> EnCours : Enregistrer et lancer
    EnCours --> Terminé : succès
    EnCours --> Échec : erreur d'une étape
    EnCours --> Arrêté : Arrêter
    Terminé --> EnCours : relancer
    Échec --> EnCours : corriger puis relancer
    Arrêté --> EnCours : relancer
```

Le traitement enchaîne les étapes suivantes (durée indicative : quelques minutes par document, selon la taille des textes) :

```mermaid
flowchart TD
    A[Appel à propositions<br/>→ AttenduAPP] --> C
    B[Documents Zotero<br/>texte, annotations, notes] --> C{ }
    C --> D[Graphe de concepts]
    C --> E[Accord inter-juges]
    D --> F[Export des concepts<br/>dans Omeka S]
    E --> F
    F --> G[Proposition d'article<br/>PropAPP]
    G --> H[Relecture épistémologique]
    H --> I[Rapport de traitement]
```

Un document dont l'extraction sémantique est déjà faite (date `curation:access` renseignée dans Omeka S) n'est pas retraité : ses concepts sont relus dans Omeka S. Relancer est donc rapide quand seuls quelques documents ont changé.

### Résultats

L'onglet **Résultats** affiche les documents produits : markdown mis en forme, tableaux CSV, graphe interactif.

| Document | Contenu | Emplacement dans Omeka S |
|---|---|---|
| **PropAPP** | proposition d'article : métadonnées (titre, auteurs, mots-clés), texte selon le plan, annexe des citations, références BibTeX | item de l'appel |
| **AttenduAPP** | analyse des attendus de l'appel : problématique, axes, contraintes formelles, critères, calendrier | item de l'appel |
| Références BibTeX | `PropAPP.bib`, notices de la collection | item de l'appel |
| Relecture épistémologique | critique de PropAPP au regard d'AttenduAPP | item de configuration de l'exécution |
| Graphe de concepts | visualisation interactive sigma.js (les données graphology JSON restent en local) | item de configuration de l'exécution |
| Désaccords entre juges | CSV des phrases codées, désaccords en tête | item de configuration de l'exécution |
| Rapport de traitement | étapes, documents traités, graphe, accord inter-juges, appel et proposition, **tokens consommés, coût estimé (énergie, carbone, argent)** | item de configuration de l'exécution |

#### Le graphe de concepts

La taille d'un concept dépend de son nombre de relations, sa couleur de sa catégorie. **Survoler** un concept met en évidence ses voisins ; **cliquer** ouvre sa fiche (relations, documents sources, lien vers l'item Omeka S). La recherche, la légende (pour masquer une catégorie) et le zoom sont dans le panneau.

#### Les auteurs de la proposition

Les **annotateurs Zotero** sont auteurs de la proposition (par nombre d'annotations décroissant), suivis des *auteurs supplémentaires* saisis dans les paramètres.

#### Lire l'accord inter-juges

| Kappa | Interprétation (Landis et Koch) |
|---|---|
| ≤ 0 | aucun accord |
| 0,01 – 0,20 | léger |
| 0,21 – 0,40 | passable |
| 0,41 – 0,60 | modéré |
| 0,61 – 0,80 | **substantiel** : seuil de validation du corpus |
| > 0,80 | presque parfait |

Le kappa de Fleiss est calculé pour trois juges ou plus, et le kappa de Cohen s'y ajoute avec deux juges. Le rapport liste les codes les plus souvent confondus et un bilan rédigé par l'agent analyste ; le CSV détaille chaque phrase pour un recalibrage ciblé.

#### La consommation de tokens

Le rapport de traitement indique le nombre de tokens consommés par les modèles : total, entrée, sortie (et raisonnement), détaillé par traitement (attendus de l'appel, extraction, nettoyage du graphe, rédaction, relecture, bilan kappa) et par modèle. Le total est aussi enregistré dans l'item de configuration de l'exécution (`curation:data`) et affiché dans l'onglet *Appels traités*.

#### Le coût du traitement

Le rapport estime aussi le **coût du traitement** : énergie consommée (Wh), émissions de gaz à effet de serre (g CO₂e), coût de l'électricité et **coût équivalent API** (ce qu'aurait coûté le même volume de tokens aux tarifs du marché ; l'API Albert étant mise à disposition par l'État, ce n'est pas un montant facturé), détaillés par modèle, avec des ordres de grandeur (ampoule LED, recharge de smartphone).

Il s'agit d'une **estimation**, pas d'une mesure : l'énergie par token est déduite de la taille du modèle (paramètres actifs), du rendement des processeurs graphiques, de leur taux d'utilisation et du PUE du centre de données. Toutes ces hypothèses, l'intensité carbone de l'électricité et les tarifs de référence sont modifiables dans **Paramètres › Coût du traitement** et rappelées en bas de la section du rapport. La fabrication du matériel, le réseau et les postes de travail ne sont pas comptés.

L'estimation est aussi enregistrée dans l'item de configuration de l'exécution (`curation:data`) et affichée dans l'onglet *Appels traités*.

### Appels traités

L'onglet **Appels traités** liste les appels à propositions déjà analysés, avec l'historique de leurs exécutions (date, collection, statut, durée, tokens, coût estimé, titre de la proposition, lien vers la configuration dans Omeka S). Il réunit l'historique local (`workflow.history.json`) et les configurations enregistrées dans Omeka S : les exécutions faites depuis une autre machine ou avant une réinstallation y figurent aussi.

Pour chaque appel :

- **Rejouer** relance l'analyse avec la collection choisie (par défaut, la dernière utilisée), **avec les paramètres et les connexions actuels** : c'est l'usage prévu après une modification de la collection Zotero (nouveaux documents, annotations, notes), un changement de modèle ou de connexion ;
- **Charger dans les paramètres** reprend l'appel et la collection dans l'onglet Configuration, pour les ajuster avant de lancer.

Seuls les documents nouveaux ou modifiés sont retraités : ceux dont l'extraction est déjà faite sont relus dans Omeka S. Un appel importé depuis un fichier local ne peut être rejoué que si le fichier est toujours présent dans `aap/`.

## 3. exploZoteroAnno : animer une annotation collective

**exploZoteroAnno** est la seconde application, avec son propre serveur : http://127.0.0.1:7273 (lien dans l'en-tête de l'Atelier d'articles). Elle peut analyser pendant qu'un traitement de l'Atelier est en cours. Elle comporte huit onglets : Grille, Exécution, Analyses, Participation, Collaborations, Thèmes, RAG et Rapport ; ses connexions se règlent sur la page **⚙ Paramètres**. Elle accompagne un groupe qui annote ensemble une collection Zotero : elle fixe une grille de couleurs commune, mesure la participation de chacun, analyse les convergences et divergences de lecture, et propose des thèmes pour une séance de discussion. Tout est enregistré dans Omeka S.

```mermaid
flowchart LR
    G[Définir la grille<br/>de couleurs] --> P[Partager le guide<br/>d'annotation]
    P --> A["Annotation collective<br/>dans Zotero (groupe)"]
    A --> R[Analyser]
    R --> V1[Participation]
    R --> V2[Collaborations]
    R --> V3[Thèmes de discussion]
    V3 --> S[Séance de discussion]
    S --> A
```

### Paramétrer la grille (onglet Grille)

- **Collection** : la collection Zotero annotée, idéalement dans une **bibliothèque de groupe** pour que chaque annotation garde son auteur. La liste suit la bibliothèque enregistrée sur la page Paramètres, et l'application retient la collection choisie pour chaque bibliothèque.
- **Grille de couleurs** : pour chaque couleur de surlignage de Zotero, une signification (idée clé, accord, désaccord, définition, méthode, question, exemple, contexte par défaut) et une consigne « quand l'utiliser ». La grille se modifie librement (couleurs, libellés, ajout ou suppression).
- **Guide d'annotation** : produit à partir de la grille, avec les consignes d'annotation (bibliothèque de groupe, commentaires, notes, marqueurs). Il se copie ou se télécharge pour être envoyé aux collaborateurs, et il est enregistré dans Omeka S à chaque analyse.
- **RAG Albert** : indexation des documents dans Albert à chaque analyse (activée par défaut), dépôt aussi dans les autres collections du document, taille et chevauchement des extraits, nombre d'extraits par question et méthode de recherche par défaut, instructions générales du modèle (voir l'onglet RAG).
- **Analyse** : similarité à partir de laquelle deux surlignages portent sur le même passage, nombre minimum de passages communs pour calculer un kappa, nombre de thèmes de discussion, et **fusion des documents en double** (activée par défaut) : quand plusieurs membres du groupe ont ajouté le même document à la collection (même fichier, même DOI, même URL, ou même titre et même année), il n'est enregistré qu'une fois dans Omeka S et cumule les surlignages, notes et marqueurs de tous ses exemplaires. L'onglet Participation signale ces documents (« N exemplaires fusionnés ») et le rapport les liste.

**Enregistrer** garde les réglages sans lancer de traitement ; **Rétablir la grille par défaut** remet les couleurs d'origine. **Enregistrer et analyser** lance le workflow ; il peut être relancé à tout moment pendant l'annotation : les nouvelles annotations de Zotero sont prises en compte, sans réextraire les documents déjà enregistrés dans Omeka S.

### Suivre le traitement (onglet Exécution)

Le journal s'affiche en direct : documents lus, doublons fusionnés, annotations enregistrées, étapes de l'analyse. **Arrêter** interrompt le traitement ; les documents et annotations déjà enregistrés dans Omeka S y restent. Un seul traitement exploZoteroAnno à la fois, indépendamment de l'Atelier d'articles.

### Recharger une analyse déjà effectuée (onglet Analyses)

Les onglets de résultats affichent par défaut la **dernière analyse**. L'onglet **Analyses** liste toutes les analyses déjà effectuées (date, collection, statut, durée, participation, tokens, coût estimé) : celles de l'archive locale et celles enregistrées dans Omeka S, y compris les analyses lancées depuis une autre machine ou avant une réinstallation.

- **Charger** affiche les résultats de l'analyse choisie dans les onglets Participation, Collaborations, Thèmes et Rapport. Un bandeau rappelle quelle analyse est affichée ; **Revenir à la dernière analyse** rétablit l'affichage courant. Rien n'est recalculé : les fichiers de l'analyse sont relus (archive locale, sinon médias de son item de configuration dans Omeka S).
- **Reprendre les réglages** recopie la collection, la grille et les paramètres de cette analyse dans l'onglet Grille, pour la relancer à l'identique ou comparer ; rien n'est enregistré avant **Enregistrer**.

Recharger des analyses successives d'une même collection permet de suivre l'évolution de l'annotation (participation, convergences) d'une séance à l'autre. À la fin d'un nouveau traitement, l'affichage revient à la dernière analyse.

### Visualiser la participation (onglet Participation)

- chiffres clés : collaborateurs, surlignages, notes, documents annotés, couleurs hors grille (surlignages dont la couleur n'est proche d'aucune couleur de la grille), doublons fusionnés ;
- une barre par collaborateur, découpée selon la signification des couleurs (et les notes) ;
- la chronologie des annotations par semaine et par collaborateur ;
- le détail par personne (commentaires, mots surlignés, documents, part de l'effort, jours actifs, première et dernière annotation) ;
- la couverture de la collection : qui a annoté quel document, et les documents encore sans annotation ; un document présent en plusieurs exemplaires porte la mention « N exemplaires fusionnés » (le détail des clés Zotero s'affiche au survol).

### Analyser les collaborations (onglet Collaborations)

- **passages en commun** : deux surlignages d'un même document sont rapprochés quand leurs mots se recouvrent suffisamment ;
- **convergence** (même signification) et **divergence** (significations différentes) de lecture sur ces passages ;
- **matrice** des passages en commun et de l'accord pour chaque paire de collaborateurs ;
- **kappa** d'accord sur la signification des couleurs, calculé à partir d'un nombre minimum de passages communs ;
- les **passages aux lectures divergentes**, avec la lecture et le commentaire de chacun ;
- le **réseau** collaborateurs–documents (sigma.js), où les liens entre collaborateurs indiquent leurs passages communs et leur accord.

### Générer des thèmes de discussion (onglet Thèmes)

Un agent propose des thèmes pour une séance collective à partir des passages divergents et convergents, des commentaires, des notes et des marqueurs : pour chaque thème, une question ouverte, la raison du choix, les passages à relire (avec les personnes concernées) et une piste d'animation. Il veille à impliquer aussi les participants les moins actifs.

### Interroger la collection (onglet RAG)

Le **RAG** (génération augmentée par la recherche, [guide Albert](https://guides.ia.numerique.gouv.fr/albert-api/guides/rag)) permet de poser une question à la collection : les passages les plus pertinents sont cherchés dans le texte des documents, puis un modèle de langage répond à partir de ces seuls passages, en les citant.

```mermaid
flowchart LR
    Z[(Collection Zotero<br/>« Lectures »)] -- analyse --> A[(Collection privée Albert<br/>« Lectures »)]
    Q[Question] --> S[Recherche<br/>hybride, sémantique ou lexicale]
    A --> S
    P[Modèle de prompt<br/>Omeka S] --> M[Modèle de langage]
    S -- extraits numérotés --> M
    M --> R[Réponse citée,<br/>coût]
    R -. si demandé .-> O[(Omeka S<br/>Réponse RAG)]
```

**Indexation**, à chaque analyse (*Grille › RAG Albert*) :

- chaque collection Zotero a une **collection privée Albert de même nom**, créée au besoin ;
- le texte de chaque document (référence puis texte extrait) y est déposé **une seule fois**, même si le document est en double dans la collection ;
- un document qui appartient aussi à **d'autres collections Zotero** est déposé dans chacune des collections Albert correspondantes ;
- les documents déjà présents dans une collection Albert ne sont pas redéposés ; les liens sans fichier (pas de texte) ne sont pas indexés ;
- le résultat du dépôt (collections et documents Albert créés) est enregistré dans un fichier JSON, média « Indexation RAG Albert » de l'**item Omeka S du document**.

**Consultation** :

1. choisir la **collection** (l'état de sa collection Albert s'affiche) et un **modèle de prompt** ;
2. saisir la **question**, ajuster si besoin le nombre d'extraits, la méthode de recherche et le modèle de langage ;
3. **Interroger** : la réponse s'affiche, ses citations `[n]` renvoient aux extraits utilisés (document, auteurs, score, item Omeka S), avec le **coût de la consultation** (tokens de la recherche et de la réponse, énergie, carbone, équivalent API) ; le prompt envoyé au modèle est consultable ;
4. **Enregistrer dans Omeka S**, si la réponse mérite d'être gardée : elle devient un item « Réponse RAG » (voir section 4) et rejoint la liste des **réponses enregistrées** de la collection.

**Modèles de prompt** : ils sont enregistrés dans Omeka S, donc partagés par tous les utilisateurs de l'instance. **Créer les modèles par défaut** propose Synthèse, Définitions, Questions de discussion et Citations ; **Nouveau modèle** et **Modifier** ouvrent l'éditeur. Un gabarit utilise les variables `{{question}}`, `{{extraits}}` (extraits numérotés ; ajoutés à la fin s'ils ne sont pas placés) et `{{collection}}`.

**Coût** : l'indexation compte la vectorisation du texte déposé (estimation, environ 4 caractères par token, modèle `bge-m3`) dans le coût de l'analyse ; chaque consultation affiche son propre coût. Albert ne facturant pas ces appels, il s'agit d'estimations faites avec les hypothèses de la configuration (voir *Le coût du traitement*).

### Rapport et enregistrement (onglet Rapport)

Le rapport reprend participation (dont les documents en double fusionnés), collaborations, thèmes et indexation RAG (collections Albert, documents déposés ou déjà présents), ainsi que les tokens consommés et le coût estimé (énergie, carbone, argent). Chaque analyse crée dans Omeka S un item « Configuration explo-zotero-anno » (classe `dcterms:MethodOfInstruction`) avec la grille et les paramètres, son statut, sa consommation et, en médias : guide d'annotation, rapport, thèmes, réseau, données de participation et de collaborations. Les documents et annotations de la collection sont enregistrés comme dans l'Atelier d'articles (`oa:Annotation` avec auteur, couleur, date).

## 4. Ce qui est enregistré dans Omeka S

```mermaid
flowchart TD
    COL[Collection Zotero<br/>bibo:Collection] --- CFG[Configuration d'exécution<br/>dcterms:MethodOfInstruction]
    AAP[Appel à propositions<br/>bibo:CallForPapers] -- dcterms:relation --> COL
    DOC[Document Zotero<br/>bibo:AcademicArticle, bibo:BookSection…] -- dcterms:isPartOf --> COL
    ANN[Annotation<br/>oa:Annotation] -- oa:hasTarget --> DOC
    DOC -- dcterms:subject --> CON[Concept<br/>skos:Concept]
    ANN -- curation:tag --> CON
    CON -- dcterms:relation --> CON
    AAP -. médias .-> M1[AttenduAPP, PropAPP, BibTeX]
    CFG -. médias .-> M2[Atelier : relecture, graphe,<br/>rapport, CSV]
    CFG -. médias .-> M3[exploZoteroAnno : guide, rapport,<br/>thèmes, réseau, JSON]
    DOC -. média .-> J[Indexation RAG Albert<br/>JSON]
    REP[Réponse RAG<br/>bibo:Note] -- dcterms:references --> DOC
    REP -- dcterms:source --> PR[Modèle de prompt RAG<br/>dcterms:MethodOfInstruction]
    REP -- dcterms:isPartOf --> COL
```

Les deux applications utilisent les mêmes classes : un document, une annotation ou un concept enregistré par l'une est retrouvé par l'autre. Seuls l'appel à propositions et ses médias sont propres à l'Atelier d'articles.

- Chaque **document** porte les métadonnées de sa notice Zotero (auteurs, date, revue, DOI…), son texte, ses fichiers et images, et la date de sa dernière extraction (`curation:access`). Un document fusionné par exploZoteroAnno porte les clés Zotero de tous ses exemplaires (`dcterms:identifier`).
- Chaque **annotation** porte le passage, votre commentaire, la couleur et le positionnement, les marqueurs (liés aux concepts), le code de la grille, son auteur et sa date (`dcterms:created`).
- Un **concept** n'est jamais créé en double : avant de le créer, le workflow cherche un concept de même identifiant ou de même titre.
- exploZoteroAnno ajoute les **modèles de prompt RAG** (titre, description, gabarit) et les **réponses RAG** enregistrées (question, réponse, documents cités, modèle de prompt, coût et extraits dans `curation:data`, réponse complète en Markdown en média), ainsi que la trace JSON de l'indexation sur chaque document.
- Chaque **exécution**, de l'une ou l'autre application, crée un item de configuration (« Configuration academic-paper-factory » ou « Configuration explo-zotero-anno ») : configuration (sans les clés d'API), statut, tokens consommés, coût estimé et, en médias, ses documents de fin d'analyse.

## 5. Questions fréquentes

**Puis-je modifier le plan de la proposition ?** Oui, dans *Paramètres › Proposition d'article › Plan de la proposition*. Les titres et leur ordre sont respectés par le rédacteur.

**Pourquoi un document n'est-il pas retraité ?** Son extraction est déjà faite (`curation:access`). Pour la relancer, vider cette propriété sur l'item du document dans Omeka S.

**Une nouvelle note Zotero est-elle prise en compte ?** Oui : elle est ajoutée aux annotations du document dans Omeka S, et ses marqueurs deviennent des concepts, sans relancer l'extraction du document.

**Puis-je utiliser les deux applications en même temps ?** Oui : chacune a son serveur et son traitement en cours. Elles partagent Omeka S ; un document extrait par l'une n'est pas réextrait par l'autre.

**exploZoteroAnno : pourquoi un collaborateur n'apparaît-il pas ?** Ses annotations n'ont pas d'auteur (bibliothèque personnelle, PDF annoté hors de Zotero) : elles sont regroupées sous « (non attribué) ». Ou bien elles ne sont pas encore synchronisées avec le serveur Zotero.

**exploZoteroAnno : que signifie « couleurs hors grille » ?** Des surlignages dont la couleur est trop éloignée de toutes celles de la grille (tolérance réglable). Ils sont comptés dans la participation, mais sans signification.

**exploZoteroAnno : pourquoi le RAG ne trouve-t-il rien ?** La collection n'est pas encore indexée (lancer une analyse avec *Indexer les documents dans Albert*), ou ses documents sont des liens sans texte. L'indexation par Albert peut aussi prendre quelques instants après le dépôt.

**exploZoteroAnno : que voit Albert ?** Le texte extrait des documents de la collection, envoyé à l'API Albert (plateforme de l'État) dans des collections privées propres à la clé d'API. Décocher *Indexer les documents dans Albert* pour ne rien envoyer.

**exploZoteroAnno : comment sont repérés les documents en double ?** Même fichier, même DOI, même URL, ou même titre (assez long) et même année. Un seul exemplaire est enregistré dans Omeka S, de préférence le PDF ; les annotations, notes et marqueurs de tous les exemplaires y sont cumulés. Pour désactiver la fusion : *Grille › Analyse › Fusionner les documents en double*.

**Le rédacteur peut-il inventer des références ?** Il ne reçoit que les clés BibTeX de la collection et doit citer uniquement celles-ci (syntaxe Pandoc `[@clé, p. 12]`) ; la relecture épistémologique vérifie l'usage des références.

---
name: connecteur-api
description: Brancher une API externe dans l'écosystème (ex. Isidore, HAL/AuréHAL, Grist, Crossref, écriture Zotero) — client dans src/lib, clés dans .env / .env.<app> gérées par la page ⚙ Paramètres, test de connexion, réglages dans la configuration de l'application. À utiliser dès qu'un workflow doit lire ou écrire un service web, ou qu'on étend les clients Albert / Zotero / Omeka S existants.
---

# Connecteur d'API

## 1. Réutiliser d'abord

| Service | Client | Points d'entrée utiles |
|---|---|---|
| Albert (LLM, RAG, transcription) | `src/lib/albert/albert.ts` (`new Albert(workflowConfig.models.provider, process.env.ALBERT_API_KEY)`) | `collections`, `ensureCollection`, `documents`, `createDocument`, `search`, `chat`, `transcribe` ; modèles Mastra via `src/config/models.ts` |
| Zotero (API web v3) | `src/lib/zotero/zotero.ts` (`new Zotero(userId, apiKey, groupId?)`) | `collection`, `item`, `file`, `notes`, `annotations`, `page`, items avec `include=data,bibtex,citation` ; `collectionWithDescendants`, `zoteroWebUrl`, `authorOf`, `tagNames`. **Lecture seule** aujourd'hui : l'écriture (création d'item, ajout à une collection) est à ajouter dans cette classe (en-tête `Zotero-Write-Token`, `POST /items`, clé d'API avec droit d'écriture). |
| Omeka S | `src/lib/omeka/omk.ts` (`await getOmk()`) | `createItem`, `updateResource`, `uploadMedia`, `searchItemsByProp`, `getPropByTerm`, `getClassByTerm` ; voir skill `persistance-omeka` |
| Grist | `src/lib/chaoticum/grist.ts` | lecture d'une table, modification, `frameable` (contrôle d'URL externe sûr) |

Étendre un client existant plutôt qu'en créer un second pour le même service.

## 2. Nouveau client — `src/lib/<service>/<service>.ts`

Sur le modèle de `Albert` / `Zotero` : une classe, sans dépendance npm (`fetch` natif), messages d'erreur en français qui nomment le service et le code HTTP.

```ts
// Client de l'API <Service> (<url de la doc>) : <ce qu'on en utilise>
import { containerUrl, networkError } from "../omeka/omk";

export class Isidore {
  private base: string;
  // base : adresse de l'API, lue dans la configuration de l'application (vérifier l'adresse dans la doc du service)
  constructor(base: string, private apiKey = "") {
    this.base = base.replace(/\/+$/, "");
  }

  private async request(endpoint: string, query: Record<string, string | number> = {}): Promise<any> {
    const url = containerUrl(`${this.base}${endpoint}?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`);
    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: "application/json", ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) } });
    } catch (e) {
      throw networkError(url, e);
    }
    if (!res.ok) throw new Error(`Isidore ${res.status} sur ${endpoint}`);
    return res.json();
  }

  // méthodes métier typées : search(…), resource(…)
}
```

- `containerUrl` réécrit `localhost` en `host.docker.internal` dans Docker ; `networkError` donne un message lisible.
- Pagination : boucler jusqu'à épuisement, avec un plafond venant de la configuration.
- Polies avec les API publiques : délai/limite de requêtes paramétrables, cache local dans `resultats/<app>/cache/` si les mêmes requêtes reviennent.
- Normaliser la réponse vers un type interne (titre, auteurs, année, DOI, URL, résumé, source) pour que les étapes ne dépendent pas du format de l'API.
- Pour des listes de référence peu changeantes (ex. disciplines AuréHAL), prévoir une route `GET /api/<app>/<liste>` qui les sert à la page (avec cache), plutôt que de les coder en dur.

## 3. Clés et réglages

- **Secrets et adresses** (clé, URL d'instance) → variables d'environnement. Ajouter à `ENV_FIELDS` dans `src/ui/server.ts`, sous `...(APP === "<app>" ? [ … ] : [])` si propres à une app :
  `{ key: "ISIDORE_API_KEY", label: "Clé API Isidore", secret: true, group: "Isidore", help: "Facultatif : …" }`. Ils sont alors éditables dans ⚙ Paramètres (`settings.html`, groupés par `group`), écrits dans le dernier fichier de `envFiles` de l'app, masqués à la lecture. Ajouter la clé vide à `.env.example`.
- **Réglages métier** (discipline, intervalle de dates, nombre de résultats, seuils) → `default<App>Config` (section dédiée, commentée), modifiables dans la page de l'app. Jamais dans `.env`.
- Le lanceur lit `process.env` (le serveur fusionne `.env` + `.env.<app>` dans l'environnement du processus enfant). Côté serveur, utiliser `readEnv()`, pas `process.env`.

## 4. Test de connexion

Dans `checkConnections()` (`src/ui/server.ts`), un bloc `try/catch` par service, qui fait l'appel le moins coûteux possible et renvoie `{ ok, message }` explicite (« 12 345 résultats pour test », « clé refusée : … »). Pour une écriture, tester les droits **sans effet de bord** (cf. le `PATCH` sur un item Omeka inexistant : 404 = droits OK, 403 = refusé). Le résultat s'affiche dans ⚙ Paramètres et sur la page de l'app.

## 5. Sécurité

- Aucune URL fournie par un utilisateur ou un document n'est appelée sans contrôle : réutiliser la logique de `frameable` (`grist.ts`) — redirections suivies à la main, adresses locales/privées refusées.
- Ne jamais logguer une clé ; ne jamais la mettre dans une URL de requête si l'API accepte un en-tête.

## 6. Documenter

`docs/installation.md` (où obtenir la clé), `docs/technique.md` (module dans le tableau « Outils et bibliothèques », clés de config, test de connexion), `README.md` si c'est une nouvelle source.

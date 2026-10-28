// Copies d'écran de la documentation utilisateur (docs/img/*.png) prises sur les serveurs locaux en cours d'exécution
// Lancement : npm run ui, ui:explo, ui:chaoticum dans d'autres terminaux, puis npm run docs:captures [nom…]
import fs from "fs";
import path from "path";
import { chromium, type Page } from "playwright";

const OUT = path.resolve(__dirname, "..", "docs", "img");
const PAPER = process.env.PAPER_URL ?? "http://127.0.0.1:7272";
const EXPLO = process.env.EXPLO_URL ?? "http://127.0.0.1:7273";
const CHAOTICUM = process.env.CHAOTICUM_URL ?? "http://127.0.0.1:7276";
// temps laissé aux appels /api (Zotero, Omeka S) et aux graphes pour se dessiner
const SETTLE_MS = Number(process.env.CAPTURE_SETTLE_MS ?? 2500);

type Capture = {
  name: string;
  url: string;
  // actions à jouer avant la capture (onglet, chargement d'une analyse…)
  prepare?: (page: Page) => Promise<void>;
  // zone capturée : la page entière par défaut, sinon un sélecteur CSS
  selector?: string;
  fullPage?: boolean;
};

const tab = (id: string) => async (page: Page) => {
  await page.click(`nav button[data-tab="${id}"]`);
  await page.waitForTimeout(SETTLE_MS);
};

// recharge la première analyse de la liste (onglet Analyses) avant d'ouvrir un onglet de résultats
const exploTab = (id: string) => async (page: Page) => {
  await tab("runs")(page);
  const open = page.locator("#tab-runs button", { hasText: /Charger|Ouvrir|Afficher/ }).first();
  if (await open.count()) { await open.click(); await page.waitForTimeout(SETTLE_MS); }
  await tab(id)(page);
};

// masque les identifiants et adresses de la page Paramètres (les secrets ne sont déjà jamais réaffichés)
const maskConnections = async (page: Page) => {
  await page.evaluate(() => {
    for (const key of ["ZOTERO_USER_ID", "ZOTERO_GROUP_ID", "OMKS_API_URL", "OMKS_KEY_IDENTITY"]) {
      const input = document.querySelector<HTMLInputElement>(`#env-${key}`);
      if (input) input.value = key === "OMKS_API_URL" ? "https://omeka.exemple.fr/api" : key.endsWith("_ID") ? "1234567" : "xxxxxxxxxxxxxxxx";
    }
  });
};

const click = (selector: string, text?: RegExp) => async (page: Page) => {
  await page.locator(selector, text ? { hasText: text } : {}).first().click();
  await page.waitForTimeout(SETTLE_MS);
};
const chain = (...steps: ((page: Page) => Promise<void>)[]) => async (page: Page) => { for (const s of steps) await s(page); };

// adresse du lecteur de la partition la plus récente (premier bouton Jouer de l'onglet Partitions et séances)
const openPlayer = (browse: boolean) => async (page: Page) => {
  await tab("partitions")(page);
  const href = await page.locator('#tab-partitions a[href^="/jouer"]').first().getAttribute("href");
  await page.goto(new URL(href!, CHAOTICUM).href, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE_MS);
  // sans enregistrer : la capture ne crée pas de séance dans Omeka S
  if (browse) await click("button", /Parcourir sans enregistrer/)(page);
};

const CAPTURES: Capture[] = [
  { name: "parametres", url: `${PAPER}/parametres`, prepare: maskConnections },
  { name: "paper-configuration", url: PAPER },
  { name: "paper-workflow", url: PAPER, prepare: tab("workflow") },
  { name: "paper-agent", url: PAPER, prepare: chain(tab("workflow"), click("#tab-workflow *", /^Rédacteur académique/)) },
  { name: "paper-resultats", url: PAPER, prepare: tab("results") },
  { name: "paper-graphe", url: PAPER, prepare: chain(tab("results"), click("#tab-results button", /Graphe de concepts/)) },
  { name: "paper-appels", url: PAPER, prepare: tab("history") },
  { name: "explo-grille", url: EXPLO },
  { name: "explo-analyses", url: EXPLO, prepare: tab("runs") },
  { name: "explo-participation", url: EXPLO, prepare: exploTab("participation") },
  { name: "explo-collaborations", url: EXPLO, prepare: exploTab("collab") },
  { name: "explo-themes", url: EXPLO, prepare: exploTab("themes") },
  { name: "explo-rag", url: EXPLO, prepare: tab("rag") },
  { name: "explo-rapport", url: EXPLO, prepare: exploTab("report") },
  { name: "chaoticum-partition", url: CHAOTICUM },
  { name: "chaoticum-partitions", url: CHAOTICUM, prepare: tab("partitions") },
  { name: "chaoticum-seances", url: CHAOTICUM, prepare: chain(tab("partitions"), click("#tab-partitions button", /^Séances$/)) },
  { name: "chaoticum-lecteur-accueil", url: CHAOTICUM, prepare: openPlayer(false) },
  { name: "chaoticum-lecteur", url: CHAOTICUM, prepare: openPlayer(true) },
];

async function main() {
  const only = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: "light", locale: "fr-FR" });
  for (const c of CAPTURES.filter(c => !only.length || only.includes(c.name))) {
    const page = await context.newPage();
    try {
      await page.goto(c.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(SETTLE_MS);
      await c.prepare?.(page);
      const file = path.join(OUT, `${c.name}.png`);
      if (c.selector) await page.locator(c.selector).first().screenshot({ path: file });
      else await page.screenshot({ path: file, fullPage: c.fullPage ?? false });
      console.log(`📸 ${c.name}.png`);
    } catch (e: any) {
      console.warn(`⚠️ ${c.name} : ${e.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
}

main();

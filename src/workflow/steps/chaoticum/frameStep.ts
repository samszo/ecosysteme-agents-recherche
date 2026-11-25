import { createStep } from "@mastra/core/workflows";
import { chaoticumConfig } from "../../../config/chaoticum";
import type { Screen } from "../../../lib/chaoticum/partition";
import { applyFrame, composeFrame, insertFrames } from "../../../lib/chaoticum/frame";

// 3. Cadre de la séance : écrans d'introduction, d'argumentaire général et de conclusion (remerciements), rédigés à
// partir de toute la partition ; leur durée a été réservée par planScreens
export const frameStep = createStep({
  id: "frame",
  execute: async ({ inputData, getStepResult }) => {
    const c = chaoticumConfig;
    const { screens } = inputData as { screens: Screen[] };
    if (!c.frame.enabled) return { screens };
    const added = insertFrames(screens, c, c.title);
    if (!added.length) return { screens };
    console.log(`🧠 Agent : écrans de cadre (${added.join(", ")})...`);
    try {
      const theme = (getStepResult("material") as any)?.theme;
      applyFrame(screens, await composeFrame({ title: c.title, description: c.description, screens }, c, added, { theme }));
      for (const s of screens.filter(x => x.cadre)) console.log(`   🪧 ${s.type} : ${s.cadre!.title}${s.cadre!.subtitle ? ` — ${s.cadre!.subtitle}` : ""}`);
    } catch (e) {
      // les écrans restent, avec leurs titres par défaut : à compléter dans l'éditeur d'écran
      console.warn("⚠️ Textes des écrans de cadre non rédigés :", (e as Error).message);
    }
    return { screens };
  },
});

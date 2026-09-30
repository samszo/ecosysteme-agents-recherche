// Estimation du coût d'un traitement à partir des tokens consommés : énergie, carbone, argent
// Énergie par token ≈ 2 × paramètres actifs (opérations) / (rendement GPU × taux d'utilisation) × PUE
import type { UsageSummary } from "./usage";
import { workflowConfig } from "../../config";

export interface ModelImpact {
  model: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  energyWh: number;
  co2g: number;
  apiCost: number;
  known: boolean;
}

export function estimateImpact(usage: UsageSummary, costs = workflowConfig.costs) {
  const { flopsPerJoule, utilization, pue } = costs.hardware;
  const byModel = new Map<string, ModelImpact>();

  for (const e of usage.entries) {
    const params = costs.models.find(m => m.model === e.model);
    const p = params ?? costs.fallback;
    // joules par token = 2 × paramètres actifs / (opérations utiles par joule) × PUE
    const joulesPerToken = (2 * p.activeParamsB * 1e9) / (flopsPerJoule * utilization) * pue;
    const m = byModel.get(e.model) ?? { model: e.model, tokens: 0, inputTokens: 0, outputTokens: 0, energyWh: 0, co2g: 0, apiCost: 0, known: !!params };
    m.tokens += e.totalTokens;
    m.inputTokens += e.inputTokens;
    m.outputTokens += e.outputTokens;
    m.energyWh += (e.totalTokens * joulesPerToken) / 3600;
    m.apiCost += (e.inputTokens * p.inputPricePerM + e.outputTokens * p.outputPricePerM) / 1e6;
    byModel.set(e.model, m);
  }
  for (const m of byModel.values()) m.co2g = (m.energyWh / 1000) * costs.carbonIntensity;

  const models = [...byModel.values()];
  const energyWh = models.reduce((n, m) => n + m.energyWh, 0);
  const apiCost = models.reduce((n, m) => n + m.apiCost, 0);
  return {
    models,
    energyWh,
    co2g: (energyWh / 1000) * costs.carbonIntensity,
    electricityCost: (energyWh / 1000) * costs.electricityPrice,
    apiCost,
    currency: costs.currency,
    hypotheses: costs,
  };
}
export type ImpactSummary = ReturnType<typeof estimateImpact>;

// formats lisibles : Wh ou kWh, g ou kg, montants avec décimales adaptées
export const fmtEnergy = (wh: number) => (wh >= 1000 ? `${(wh / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh` : `${wh.toLocaleString("fr-FR", { maximumFractionDigits: wh < 1 ? 3 : 1 })} Wh`);
export const fmtCo2 = (g: number) => (g >= 1000 ? `${(g / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kg CO₂e` : `${g.toLocaleString("fr-FR", { maximumFractionDigits: g < 1 ? 3 : 1 })} g CO₂e`);
export const fmtMoney = (v: number, currency = "€") => `${v.toLocaleString("fr-FR", { minimumFractionDigits: v < 0.01 ? 4 : 2, maximumFractionDigits: v < 0.01 ? 4 : 2 })} ${currency}`;

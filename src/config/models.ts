import { createOpenAI } from "@ai-sdk/openai";
import { workflowConfig } from ".";

// 1. Ajoutez l'option compatibility: "compatible"
const albertProvider = createOpenAI({
  baseURL: workflowConfig.models.provider,
  apiKey: process.env.ALBERT_API_KEY,
  compatibility: "compatible", // 👈 CRUCIAL : Désactive les endpoints exclusifs à OpenAI
});

// 2. Utilisez explicitement .chat() au lieu de l'appel direct au provider
export const ALBERT_MODEL_ANALYTICS = albertProvider.chat(workflowConfig.models.analytics);
export const ALBERT_MODEL_FAST = albertProvider.chat(workflowConfig.models.fast);

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GEMINI_MODELS } from "./models.enum";
import { env } from "@/env";

interface ModelLangchainprops {
  cache?: boolean;
  model?: GEMINI_MODELS;
  temperature?: number;
}

export class ModelLangchain {
  gemini({
    cache = true,
    model = GEMINI_MODELS.FLASH_2_5,
    temperature = 0,
  }: ModelLangchainprops = {}) {
    return new ChatGoogleGenerativeAI({
      model,
      temperature,
      apiKey: env.GEMINI_API_KEY,
      cache,
    });
  }
}

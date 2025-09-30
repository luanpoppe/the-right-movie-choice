import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GEMINI_MODELS } from "./models.enum";
import { env } from "@/env";

export class ModelLangchain {
  gemini(model: GEMINI_MODELS = GEMINI_MODELS.FLASH_2_5, temperature = 0) {
    return new ChatGoogleGenerativeAI({
      model,
      temperature,
      apiKey: env.GEMINI_API_KEY,
    });
  }
}

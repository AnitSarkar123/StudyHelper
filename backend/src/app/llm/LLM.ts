import { ChatOpenAI } from "@langchain/openai";
export class LLM {
  private static instance: ChatOpenAI;

  // Prevent direct instantiation
  private constructor() {}

  public static getInstance(): ChatOpenAI {
    if (!LLM.instance) {
      if (!process.env.LLM_API_KEY) {
        throw new Error("❌ NVIDIA_API_KEY is not set in environment variables");
      }

      LLM.instance = new ChatOpenAI({
    configuration: {
        baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    },
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_NAME1 || "gpt-3.5-turbo",
});
    }
    return LLM.instance;
  }
}
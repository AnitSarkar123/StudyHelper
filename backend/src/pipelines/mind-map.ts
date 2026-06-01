import "dotenv/config";
import { ChatTogetherAI } from '@langchain/community/chat_models/togetherai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { ChatFireworks } from '@langchain/community/chat_models/fireworks';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { Runnable } from "@langchain/core/dist/runnables/base";
const MindElixirNode = z.object({
  id: z.string(),
  topic: z.string(),
  // Instead of recursive reference, allow children with same structure but only 1 level deep
  children: z
    .array(
      z.object({
        id: z.string(),
        topic: z.string(),
        children: z.array(
          z.object({
            id: z.string(),
            topic: z.string(),
            // stop recursion here
            children: z.array(z.any()).optional(),
          })
        ).optional(),
      })
    )
    .optional(),
});

// Ensure environment variables are loaded
if (!process.env.LLM_API_KEY || !process.env.GOOGLE_API_KEY) {
    throw new Error('LLM_API_KEY and GOOGLE_API_KEY environment variables are not set');
}

// const llm = new ChatOpenAI({
//     apiKey: process.env.LLM_API_KEY,
//     model: process.env.LLM_MODEL_NAME || "gpt-3.5-turbo",
//     configuration: {
//         baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
//     }
// });
const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    temperature: 0.5,
    maxRetries: 2,
    
})
export async function generateMindMap<T extends Runnable>(llm: T, studyguide: string) {
  
const prompt = PromptTemplate.fromTemplate(`
You are an expert Mind Map creator. Your ONLY task is to generate VALID MindElixir JSON mind map.

Study Guide:
{study_guide_text}

CRITICAL - OUTPUT FORMAT:
Your response must be EXACTLY this format with NO wrapper objects:
{{
  "id": "root",
  "topic": "Main Subject Title",
  "children": [
    {{
      "id": "1",
      "topic": "Main Topic",
      "children": [
        {{
          "id": "1.1",
          "topic": "Subtopic"
        }}
      ]
    }}
  ]
}}

RULES:
- Output ONLY the JSON object (no "root": {{...}} wrapper)
- Start with {{ and end with }}
- No explanations, no markdown code blocks
- No text before or after the JSON
- Each node must have: id (string), topic (string), children (array, optional)
- Keep node topics short (1-5 words)
- Use hierarchical ids: "1", "1.1", "1.1.1", etc.

FAIL if your response has any wrapper like "root": {{...}} or "nodeData": {{...}}
`);
const chain =prompt.pipe(llm);
const chainResult = await chain.invoke({
  study_guide_text: studyguide
});

let content = chainResult?.content as string;

// Extract JSON from response (in case there's any extra text)
let jsonString = content.trim();

// Try to find JSON object in the response
const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
if (jsonMatch) {
    jsonString = jsonMatch[0];
}

// try {
//     const json = JSON.parse(jsonString);
//     console.log(JSON.stringify(json, null, 2));
// } catch (e) {
//     console.error("Failed to parse JSON response:");
//     console.error(content);
//     console.error("\nError:", (e as Error).message);
// }
const result = JSON.parse(jsonString);
const mindmap =JSON.stringify(result, null, 2)
console.log("Generated MondMap:",mindmap)
return mindmap


}
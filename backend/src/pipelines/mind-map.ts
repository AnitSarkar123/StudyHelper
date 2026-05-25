import "dotenv/config";
import { ChatTogetherAI } from '@langchain/community/chat_models/togetherai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { ChatFireworks } from '@langchain/community/chat_models/fireworks';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
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
  study_guide_text: `
# Advanced Prompt Engineering & Augmented Language Models

#### 1. Core Principles
Prompt engineering is the strategic design of inputs to guide a Large Language Model (LLM) toward a desired output.
- Goal: Maximize accuracy, relevance, and safety.
- Mechanism: LLMs predict the next token based on patterns; clear instructions reduce ambiguity.

#### 2. Foundational Prompting Techniques
- Zero-Shot Prompting: Directly asking the model to perform a task without providing examples.
  - Example: Translate this to French: Hello, how are you?
  - Use Case: General tasks where the model already has sufficient training data.

- Few-Shot Prompting: Providing a small number of input-output examples (a demonstration) to illustrate the desired pattern or format.
  - Example: Convert to emoji: Star, Fire, Cat
  - Use Case: When specific formatting or nuanced reasoning is required.

- Instruction Prompting: Using explicit, detailed commands to dictate the task, format, tone, and constraints.
  - Example: Write a hopeful short story about a robot. Keep it under 100 words.
  - Use Case: Complex tasks requiring strict adherence to constraints.

#### 3. Advanced Reasoning: Chain-of-Thought (CoT)
For complex reasoning problems, advanced techniques are required to force the model to think before answering.

- Chain-of-Thought (CoT) Prompting: Encourages the model to articulate its reasoning step-by-step before giving the final answer.
  - Technique: Add Let's think step by step to the prompt.
  - Benefit: Drastically improves performance on math, logic, and multi-step tasks.

- Few-Shot CoT: Providing examples that include the full reasoning process (not just the answer).
  - Example: Question: If I have 3 apples and eat 1, how many are left? Reasoning: I started with 3. I ate 1. 3 minus 1 is 2. Answer: 2.

- Zero-Shot CoT: Using a trigger phrase like let's think step by step to induce reasoning without examples.

- Self-Consistency: An enhancement where the model generates multiple reasoning paths (samples) and selects the most consistent answer via majority vote.

#### 4. Augmented Language Models (ALMs) and RAG
ALMs extend LLM capabilities by connecting them to external tools and knowledge to overcome limitations like hallucination, outdated knowledge, and lack of private data access.

The Three Pillars of Augmentation:
1. Reasoning: Using techniques like Chain-of-Thought to improve internal logic.
2. Tool Use: Granting access to external APIs and functions (e.g., calculators, search engines, code interpreters).
   - Goal: Allow the model to perform actions and access real-time data.
3. Retrieval: Grounding responses in factual information from external sources.

Retrieval-Augmented Generation (RAG):
A key framework that combines an LLM with a knowledge retrieval system.
- Process:
  1. A user query is received.
  2. A search is triggered in a knowledge base (e.g., a vector database).
  3. Retrieved context (documents, chunks) is passed to the LLM.
  4. The LLM generates an answer based only on the retrieved context.
- Benefit: Reduces hallucinations and allows the model to answer questions about private or niche data.

#### 5. Supplementary Web Utilities (JavaScript Context)
- Smooth Scrolling: element.scrollToView with behavior smooth
  - Use: Enhances UX by scrolling elements into view smoothly.
- Theme Toggling: classList.toggle with localStorage
  - Use: Create a persistent light/dark mode switch that survives page reloads.

#### Summary & Key Takeaways
- Effective LLM interaction is built on clear instruction, iterative testing, and strategic augmentation.
- Progression: Start with basic techniques (Zero/Few-Shot) -> move to advanced reasoning (CoT) for complex tasks.
- Augmentation (RAG, Tool Use) is essential for applications requiring factual, dynamic, and verifiable outputs.
- Always validate the model's output, especially when using complex reasoning chains.
`
});

let content = chainResult?.content as string;

// Extract JSON from response (in case there's any extra text)
let jsonString = content.trim();

// Try to find JSON object in the response
const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
if (jsonMatch) {
    jsonString = jsonMatch[0];
}

try {
    const json = JSON.parse(jsonString);
    console.log(JSON.stringify(json, null, 2));
} catch (e) {
    console.error("Failed to parse JSON response:");
    console.error(content);
    console.error("\nError:", (e as Error).message);
}



import "dotenv/config";
import { ChatTogetherAI } from '@langchain/community/chat_models/togetherai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { ChatFireworks } from '@langchain/community/chat_models/fireworks';
import { ChatOpenAI } from '@langchain/openai';

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

const MindElixerData =z.object({
    nodeData: MindElixirNode,
})

// Ensure environment variables are loaded
if (!process.env.LLM_API_KEY) {
    throw new Error('LLM_API_KEY environment variable is not set');
}

const llm = new ChatOpenAI({
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_NAME || "gpt-3.5-turbo",
    configuration: {
        baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    }
});

const prompt = PromptTemplate.fromTemplate(`
You are an expert-level tutor in the education department. Your task is to create a Mind Map that enhances student understanding. The map must be organized, comprehensive, and accurate. Accuracy, clarity, and relevance are core success factors.

Key References:
- Tony Buzan, "The Mind Map Book" (2003)
- Peter C. Brown et al., "Make It Stick" (2014)
- Amy E. Herman, "Visual Intelligence" (2016)

Study Guide:
{study_guide_text}

Follow these rules strictly:

1. Initial Inquiry: Begin by asking the user up to 3 pertinent questions to gather essential specifics for personalization (e.g., target audience, depth, specific goals). 
   Stop here and wait for the user's response before proceeding.

2. Strategic Analysis: Take a step back and think about the task thoroughly. Consider success factors, evaluation criteria, and the user's input to craft the Mind Map.

3. Map Generation: Present the Mind Map in Valid MindElixir JSON format. 
   - Use short node names (1-5 words).
   - Move long explanations or details into child nodes.
   - Ensure the structure matches the MindElixir schema exactly.
   - Output ONLY the JSON (no markdown blocks, no introductory text).

4. Self-Evaluation: After generating the map, evaluate your work using a table with: 
   - Criteria
   - Rating (1-10)
   - Reasons for Rating

5. Refinement Options: Provide post-evaluation options for refining the Mind Map. Suggest 3-4 specific improvements (e.g., "Simplify for beginners," "Add more examples," "Expand on X topic").

6. Change Log: Append a CHANGE LOG section for any revisions or hypothetical changes made during the evaluation step.

7. Closing: Always conclude with: 
   "Would You Like Me To Evaluate This Work and Provide Options to Improve It? Yes or No"

JSON Structure Rules:
- Root node id must be "root".
- Root node topic must be the main subject.
- All children must have unique ids.
- Format as a list of Q and A or hierarchical nodes.
- Ensure the structure matches MindElixir format.
- Do not include any text outside JSON for the map itself.

Example JSON Structure:
{{
  "id": "root",
  "topic": "Main Topic",
  "children": [
    {{
      "id": "unique_id",
      "topic": "Short Node Name",
      "children": [ ]
    }}
  ]
}}

Output the Mind Map as JSON only, fully compatible with MindElixir.
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
},{
    response_format:{
        type:"json_object"
    }
} as any
);
const json =JSON.parse(chainResult?.content as string)
console.log(JSON.stringify(json, null, 2))



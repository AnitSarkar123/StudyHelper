import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import "dotenv/config";
import zodToJsonSchema from "zod-to-json-schema";
import z from "zod";
import { Runnable } from "@langchain/core/runnables";

export async function generatePrompt<T extends Runnable>(llm: T, title: string) {
  const prompt_image_generator = PromptTemplate.fromTemplate(`
You create image prompts for clean line drawing icons with bold black lines on white backgrounds.

Document Title: {input}

Generate a SHORT, simple image prompt (max 100 chars) for a clean line drawing icon:
* Bold black outlines, white/transparent background
* Geometric shapes related to the title
* Professional minimalist style
* Centered, high contrast
* NO long descriptions, NO complex phrases

EXAMPLES - keep it SHORT and SIMPLE:
- "Line icon: book with geometric shapes, bold lines, white background"
- "Clean line drawing: gear and circuit symbol merged, black outlines"
- "Bold line icon: document with tech patterns, minimalist style"

Be DIRECT. Keep it SHORT. Output the prompt ONLY, no other text:
`);

  const chain = prompt_image_generator.pipe(llm);
  const chainResult = await chain.invoke({ input: title });

  try {
    let content = chainResult?.content as string;
    console.log("🎨 Raw prompt response:", content);
    
    // Clean up the response
    const cleanPrompt = content
      .replace(/^#+\s*/gm, "") // Remove markdown headers
      .replace(/```/g, "") // Remove code blocks
      .replace(/["']/g, "") // Remove problematic quotes
      .replace(/^(Prompt:|Output:|Here's?:|Here is:)\s*/i, "") // Remove prefixes
      .trim()
      .substring(0, 110); // Keep prompts SHORT (max 110 chars)
    
    console.log("✅ Final prompt:", cleanPrompt);
    return cleanPrompt || "Line icon: geometric shapes with bold black lines, white background, minimalist style";
  } catch (parseError) {
    console.warn("⚠️ Prompt generation failed, using safe default");
    return "Line icon: geometric shapes with bold black lines, white background, minimalist style";
  }
}

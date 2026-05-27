import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { zodToJsonSchema } from "zod-to-json-schema";
import z from "zod";
// import { formatDocumentsAsString } from "langchain/util/document";
import { Document } from "@langchain/core/documents";
import { Runnable } from "@langchain/core/runnables";
// Define the prompt template
const generate_title_prompt = PromptTemplate.fromTemplate(`
You are a helpful assistant that generates SHORT, simple titles (max 50 chars).
Based on the document content, create ONE concise title capturing the main theme.

Document:
{document}

Return ONLY valid JSON with "title" field. Max 50 characters.
Example: {{"title": "Document Title"}}

JSON Response:
`);
const formatDocumentsAsString = (documents: any[]): string => {
    return documents.map((doc) => doc.pageContent).join("\n\n");
};
// Main function to generate title
export async function generateTitle<T extends Runnable>(
  llm: T,
  doc: Document<Record<string, any>>[]
): Promise<string> {
  // Convert documents to string
  const docToString = formatDocumentsAsString(doc);

  // Create the chain
  const chain = generate_title_prompt.pipe(llm);

  // Invoke the chain
  const chainResult = await chain.invoke({ document: docToString });

  // Parse the JSON response and extract the title
  try {
    const content = chainResult?.content as string;
    console.log("📝 Raw LLM response:", content);
    
    // Try to parse as JSON
    const parsed = JSON.parse(content);
    return parsed?.title || content;
  } catch (parseError) {
    // If JSON parsing fails, try to extract title from text
    console.warn("⚠️ JSON parsing failed, extracting title from text");
    const content = chainResult?.content as string;
    
    // Remove markdown formatting and extract title
    const cleanTitle = content
      .replace(/^#+\s*/gm, "") // Remove markdown headers
      .replace(/[*_`"']/g, "") // Remove markdown and quotes that trigger filters
      .replace(/^.*?:\s*/i, "") // Remove "Title: " prefix
      .split('\n')[0] // Get first line
      .trim()
      .substring(0, 80); // Strict short limit
    
    return cleanTitle || "Document";
  }
}
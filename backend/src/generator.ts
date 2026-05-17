import { AIMessage,HumanMessage,SystemMessage } from "@langchain/core/messages";
import { PromptTemplate ,ChatPromptTemplate} from "@langchain/core/prompts";
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import { queryVectorDB } from "./retriver.ts";
import { reciprocalRankFusion } from "./RRF.ts";
// import { DocumentInterface } from "@langchain/core/documents.js";
import { Document } from "@langchain/core/documents";
import { response_generator_prompt } from "./prompt.ts";
// import { formatDocumentsAsString } from "@langchain/core/documents";


const llm = new ChatOpenAI({
    configuration: {
        baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    },
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_NAME || "gpt-3.5-turbo",
});
const query ="Give Agent System Overview"
const result = await queryVectorDB(query);
const generate_question_prompt = PromptTemplate.fromTemplate(`
    You are an AI search assistant.
The user asked: {question}

Step back and consider this question more broadly:
1. Reframe it in general terms.
2. Identify the main themes or dimensions involved.
3. Generate 5 diverse search queries that cover these dimensions, ensuring each query explores a different perspective or phrasing.

Return ONLY a valid JSON object with this exact structure:
{{
    "questions": ["query1", "query2", "query3", "query4", "query5"]
}}
    `)

const formatDocumentsAsString = (documents: any[]): string => {
    return documents.map((doc) => doc.pageContent).join("\n\n");
};
const generateQuestionPrompt = await generate_question_prompt.invoke({
    question: query,
    
 })
const llmResult = await llm.invoke([
    {
        role: "user",
        content: generateQuestionPrompt.value
    }
],{
    response_format:{
        type:"json_object"
    }
} as any);
console.log("Raw LLM response:", llmResult?.content)
const parseResult = JSON.parse(llmResult?.content as string)
console.log("Parsed result:", parseResult)

// Handle different response structures
let questions: string[] = [];
if (Array.isArray(parseResult?.questions)) {
    questions = parseResult.questions;
} else if (parseResult?.q && Array.isArray(parseResult.q)) {
    questions = parseResult.q;
} else {
    console.error("Could not find questions array in response:", parseResult);
    process.exit(1);
}

console.log("Questions to search:", questions)
const allRetrivedDocs =[] as Document[][]
for (const q of questions) {
    const res = await queryVectorDB(q);
    allRetrivedDocs.push(res)
    console.log(`Results for query: "${q}"`, res);
}
const fuseDoc =reciprocalRankFusion(allRetrivedDocs)
const docToString =formatDocumentsAsString(fuseDoc)
console.log(fuseDoc);
console.log(docToString)

const generatorResponsePrompt = await response_generator_prompt.invoke({
    questions: questions.join(','),
    retrieved_docs: docToString,
    original_question: query,
})

const aiResponse =await llm.invoke([
    {
        role:"user",
        content:generatorResponsePrompt.value
    }
])

console.log("AI Response:", aiResponse?.content)


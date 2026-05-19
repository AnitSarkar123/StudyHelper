import { END, START, StateGraph, Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { Document } from "langchain";
import { AIMessage,HumanMessage,SystemMessage } from "@langchain/core/messages";
import { PromptTemplate ,ChatPromptTemplate} from "@langchain/core/prompts";
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import { queryVectorDB } from "./retriver.ts";
import { reciprocalRankFusion } from "./RRF.ts";
// import { DocumentInterface } from "@langchain/core/documents.js";
// import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
// import { response_generator_prompt } from "./prompt.ts";
import { extractMessage, generateResponseFormatter, gradeDocResponseFormater, questionsResponseFormater, TransformResponseFormatter } from "./utils/index.ts";
import { generate_question_prompt, grade_doc_prompt, response_generator_prompt, transform_query_prompt } from "./prompt/prompts.ts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { TavilySearch } from "@langchain/tavily";
// import { last } from "cheerio/dist/commonjs/api/traversing.js";
// import { formatDocumentsAsString } from "@langchain/core/documents";


const llm = new ChatOpenAI({
    configuration: {
        baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    },
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_NAME || "gpt-3.5-turbo",
});
// const llm = new ChatFireworks({
// model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
// temperature: 0.7,
// apiKey: process.env.FIREWORKS_API_KEY || "",
// });
const formatDocumentsAsString = (documents: any[]): string => {
    return documents.map((doc) => doc.pageContent).join("\n\n");
};
const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    nextNode: Annotation<string>({
        
        reducer: (previousVal, nextVal) => previousVal ?? nextVal ?? ""
    }),
    newQuery: Annotation<string>({
        
        reducer: (previousVal, nextVal) => previousVal ?? nextVal ?? ""
    }),
    retrievedDoc: Annotation<Document[]>({
        default: () => [],
        reducer: (previousVal, nextVal) => previousVal.concat(nextVal)
    }),
    generateQuestions: Annotation<Document[]>({
        default: () => [],
        reducer: (previousVal, nextVal) => previousVal.concat(nextVal)
    }),

    filterDoc: Annotation<Document[]>({
        default: () => [],
        reducer: (previousVal, nextVal) => previousVal.concat(nextVal)
    }),  
});

// Create the graph
const RetrieveNode = async (state: typeof StateAnnotation.State) => {
    const lastMessage=extractMessage(state,'human')
    const query =lastMessage?.content
    
    const generateQuestionPrompt = await generate_question_prompt.invoke({
        question: query,
        
     })
    const llmResult = await llm.invoke([
        {
            role: "user",
            content: generateQuestionPrompt.value
        }
    ],questionsResponseFormater);
    console.log("Raw LLM response:", llmResult?.content)
    
    // Strip markdown code blocks if present
    let cleanedContent = (llmResult?.content as string).trim()
    if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    
    const parseResult = JSON.parse(cleanedContent)
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
    console.log("Questions to search:", questions)
    const allRetrivedDocs =[] as Document[][]
    for (const q of questions) {
        const res = await queryVectorDB(q);
        allRetrivedDocs.push(res)
        console.log(`Results for query: "${q}"`, res);
    }
    
    const fuseDoc =reciprocalRankFusion(allRetrivedDocs)
    // const docToString =formatDocumentsAsString(fuseDoc)
    console.log(fuseDoc);
    // console.log(docToString)
    return {
        retrievedDoc: fuseDoc,
        generateQuesion:questions
    }

};
const gradeDocNode = async (state: typeof StateAnnotation.State) => {
const lastMessage=extractMessage(state,'human')
const allRetrivedDocs =state.retrievedDoc
const allFilteredDoc =[] as Document[]
const chain =grade_doc_prompt.pipe(llm)
for (const item of allRetrivedDocs) {
    // Handle both raw Document objects and RRF results { doc: Document, score: number }
    const doc = item.doc ? item.doc : item
    const pageContent = doc?.pageContent
    
    const chainResult = await chain.invoke({
        question:lastMessage?.content,
        context:pageContent
    },gradeDocResponseFormater as any)
    console.log(`Grade for document: "${pageContent}"`, chainResult);
    
    let cleanedContent = (chainResult?.content as string).trim()
    if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    
    // Handle cases where LLM returns just "yes" or "no"
    if (cleanedContent === 'yes' || cleanedContent === 'no') {
        cleanedContent = JSON.stringify({ binaryScore: cleanedContent })
    }
    
    const parsedResponse =JSON.parse(cleanedContent)
    const score = parsedResponse?.binaryScore || parsedResponse?.score
    if(score === "yes"){
        allFilteredDoc.push(new Document({ pageContent: pageContent }))
    }
}
    return{
        filterDoc: allFilteredDoc
    }
}
const transformQuery = async(state: typeof StateAnnotation.State) => {
    console.log("Transforming query...")
    const lastMessage=extractMessage(state,'human')
    const chain = transform_query_prompt.pipe(llm)
    const aiResponse = await  chain.invoke({question: lastMessage?.content || ""},TransformResponseFormatter)
    
    let cleanedContent = (aiResponse?.content as string).trim()
    if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    
    const newQuesion = JSON.parse(cleanedContent) 
    console.log("Transformed query:", newQuesion)
    return {
        newQuery: newQuesion?.improved_question || newQuesion?.question,
    }
};

const webSearch = async(state: typeof StateAnnotation.State) => {
    console.log("Performing web search with transformed query...")
    const tool = new TavilySearch({ tavilyApiKey: process.env.TAVILY_API_KEY || "", maxResults: 5, topic: "general" })
    const searchResult = await tool.invoke({ query: state.newQuery })
    
    // TavilySearch returns a string, so we convert it to a document
    const resultString = typeof searchResult === 'string' ? searchResult : JSON.stringify(searchResult, null, 2)
    const webResults = [new Document({ 
        pageContent: resultString,
        metadata: {
            source: "tavily_search"
        }
    })]
    
    return {
        retrievedDoc: webResults
    }
}
const generate = async(state: typeof StateAnnotation.State) => {
    const lastMessage = extractMessage(state, 'human')
    const docToString =formatDocumentsAsString(state.retrievedDoc)
    console.log(state.retrievedDoc);
    console.log(docToString)
    
    const generatorResponsePrompt = await response_generator_prompt.invoke({
        questions: state.generateQuestions.join(','),
        retrieved_docs: docToString,
        original_question: lastMessage?.content,
    })
    
    const aiResponse =await llm.invoke([
        {
            role:"user",
            content:generatorResponsePrompt.value
        }
    ],generateResponseFormatter)
    
    let cleanedContent = (aiResponse?.content as string).trim()
    if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    
    const result = JSON.parse(cleanedContent) as { reasoning?: string; answer: string }
    
    console.log('AI Reasoning:', result?.reasoning)
    console.log("AI Answer:", result?.answer)
    return {
        messages: [new AIMessage({ content: result?.answer || "" })]
    }
}

const router =(state: typeof StateAnnotation.State)=>{
    const filteredDocs =state.filterDoc
    if(filteredDocs.length==0){
        return "transformQuery"
    }
    return "generate"

}






const builder = new StateGraph(StateAnnotation)

    .addNode("RetrieveNode", RetrieveNode)
    .addNode("gradeDocNode", gradeDocNode)
    .addNode("generate",generate)
    .addNode("transformQuery",transformQuery)
    .addNode("webSearch", webSearch)


   builder.addEdge(START, "RetrieveNode")
    builder.addEdge("RetrieveNode", "gradeDocNode")
    builder.addConditionalEdges(
        "gradeDocNode",
        router,
    )
    builder.addEdge("transformQuery", "webSearch")
    builder.addEdge("webSearch", "generate")
    builder.addEdge("generate",END)
    const app = builder.compile();
    const result = await app.invoke({
    messages: [
        new HumanMessage({content :" What is Self-Reflection?"})
    ],
    })
console.log("Result:", result)



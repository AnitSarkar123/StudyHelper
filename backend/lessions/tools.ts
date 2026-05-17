import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import z from "zod"
import zodToJsonSchema from "zod-to-json-schema";
import { TavilySearch } from "@langchain/tavily";
import { tool, Tool } from "@langchain/core/tools";
import { Runnable, RunnableLambda } from "@langchain/core/runnables";
dotenv.config();

const model = new ChatOpenAI({
    configuration: {
        baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    },
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_NAME || "gpt-3.5-turbo",
});


const tavalySerach = new TavilySearch({
  maxResults: 5,
  topic: "general",
  // includeAnswer: false,
  // includeRawContent: false,
  // includeImages: false,
  // includeImageDescriptions: false,
  // searchDepth: "basic",
  // timeRange: "day",
  // includeDomains: [],
  // excludeDomains: [],
});

const tavalyTool =tool(
    async({query}) =>{
        const result = await tavalySerach.invoke({query:query})
        return result
    },
    {
        name:"tavily_search",
        description:"a tool to search the web using tavily search, useful to find up-to-date information on the web",
        schema: z.object({
            query: z.string().describe("the search query to find relevant information on the web")
        })
    }
)
const llmwithTool = await model.bindTools([tavalyTool])


// const result = await llmwithTool.invoke(
//     [
//         new HumanMessage("What is the latest news on AI?")
//     ]
// )
// console.log(result)

const toolChain= RunnableLambda.from(
    async(userInput:string)=>{
        const humanMessage = new HumanMessage(userInput)
        const aiMsg = await llmwithTool.invoke([{
            role:"user",
            content: userInput
        }],
    )
    console.log(aiMsg)
    const toolMsge =await tavalySerach.batch(aiMsg.tool_calls as any)
    console.log(toolMsge)
    const chainResult = await model.invoke([
        {
            role:"user",
            content: userInput
        },
        aiMsg,
        ...toolMsge

    ])
    return chainResult.content
        
    }
)

const result = await toolChain.invoke("What is the current weather of new York?")
console.log('Result:: ' + result);


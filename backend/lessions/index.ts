import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { PromptTemplate,ChatPromptTemplate } from "@langchain/core/prompts";
import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";
dotenv.config();

const model = new ChatOpenAI({
    configuration: {
        baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    },
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_NAME || "gpt-3.5-turbo",
});


const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        ` You are a professional Math Expert, your job is to solve user questions.
        Think step by step through your reasonning and explain your thoughts.

        Instruction :
        - return only  the value of x 
        `,
    ],
    ["user", "here's the user question {input}"],
]);
// const prompt= PromptTemplate.fromTemplate(`
//         You are a professional Math Expert, your job is to solve user questions.
//         Think step by step through your reasonning and explain your thought

//         here's the user question
//         {input}

//         `)


const chain = prompt.pipe(model)

const chainResult = await chain.invoke({
    input: "x+y=0, what is the value of x"
}, {
    response_format: {
        type: "json_object",
        schema: zodToJsonSchema(
            z.object({
                value_of_x: z.string(),
            }) as any
        )
    }
} as any

)
console.log(chainResult)

// const invokePrompt=await prompt.invoke({input:"x+y=0, what is the value of x"})

// const result=await llm.invoke(invokePrompt,{
//     response_format: {
//               type: "json_object",
//               schema: zodToJsonSchema(
//                 z.object({
//                   value_of_x: z.string(),
//                 })
//               )
//             }
// }
// ) as Record<string,any>

// const valueOfX=JSON.parse(result.content)
// // AiMessage
// console.log(valueOfX)
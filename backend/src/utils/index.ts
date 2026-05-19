import zodToJsonSchema from "zod-to-json-schema";
import z from "zod"

export function extractMessage(state: any, messageType: 'ai'|'human') {
    const lastHumanMessage =state.messages
        .filter((m: any) => m._getType() === messageType)
        .slice(-1)[0];
        return lastHumanMessage
}

export const questionsResponseFormater ={
    response_format:{
        type:"json_object",
        schema:zodToJsonSchema(
            z.object({
                questions:z.array(z.string())
            }) as any
        )
    }
} as any

export const gradeDocResponseFormater ={
    response_format:{
        type:"json_object",
        schema:zodToJsonSchema(
            z
            .object({
                binaryScore:z
                .enum(['yes','no'])
                .describe("Relavance score 'yes' or 'No'"),
            })
            .describe(
                "Grade the relavance of the retrieved document to the user question.Either 'yes' or 'no'"
            ) as any
        )
    }
} as any

export const generateResponseFormatter ={
    response_format:{
        type:"json_object",
        schema:zodToJsonSchema(
            z.object({
                answer :z.string(),
                reasoning: z.string()
            }) as any
        ) as any
    }
} as any

export const TransformResponseFormatter ={
    response_format:{
        type:"json_object",
        schema:zodToJsonSchema(
            z.object({
                question :z.string()
            }) as any
        )
    }
} as any
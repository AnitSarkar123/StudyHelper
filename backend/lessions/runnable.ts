import { RunnableSequence } from "@langchain/core/runnables";
import { RunnableLambda } from "@langchain/core/runnables";
import { RunnableParallel } from "@langchain/core/runnables";


const func1=(x:string)=>x.toString()
const runnable1 =RunnableLambda.from(func1)
const runnable2 =RunnableLambda.from((x:string)=>x.toLocaleUpperCase())
const runnable3 =RunnableLambda.from((x:string)=>x.slice(0,4))


const result =await runnable2.batch(["hello world","hisjdlkja"])
// const chain =new RunnableSequence(
//     {
//         first: runnable1,
//         middle: [runnable2],
//         last: runnable3
//     }
// )
// const chain = runnable1.pipe(runnable2).pipe(runnable3)
// const result = await chain.invoke("hello world")
// console.log(result)
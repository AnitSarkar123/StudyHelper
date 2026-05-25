import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import {CohereEmbeddings} from "@langchain/cohere"
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio"
import "dotenv/config"
import { VectorStore } from "@langchain/core/vectorstores";
import { CohereRerank } from "@langchain/cohere";

export async function queryVectorDB(query: string) {
    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY ?? (() => { throw new Error('COHERE_API_KEY environment variable is not set'); })(),
    });
    const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY ?? (() => { throw new Error('PINECONE_API_KEY environment variable is not set'); })(),
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME ?? (() => { throw new Error('PINECONE_INDEX_NAME environment variable is not set'); })());
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        // namespace: "notebooklm",
        maxConcurrency:5,
    });
    // const result = vectorStore.similaritySearch(query,10);
    const retriver = vectorStore.asRetriever(10);
    const result = await retriver.invoke(query)
    // return result;
    const cohereRerank = new CohereRerank({
        apiKey: process.env.COHERE_API_KEY ?? (() => { throw new Error('COHERE_API_KEY environment variable is not set'); })(),
        model: "rerank-v4.0-fast",
    });
    const rerankedDocuments = await cohereRerank.rerank(result,query,{
        topN:5,
    })
    if(result.length>0){
         return [result[rerankedDocuments[0].index]]//that is only top
        // return rerankedDocuments
        //     .slice(0, 5)
        //     .map(r => result[r.index])///for 5 response for each search query, we have 5 search query, so total 25 response, we need to rerank them and get top 5
    }
    else{
        return []
    }
    // console.log(rerankedDocuments);


}

const result = await queryVectorDB("What are the key points of the article?");
// console.log(result);
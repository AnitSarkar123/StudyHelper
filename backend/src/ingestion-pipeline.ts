import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import "dotenv/config";

export async function webFileEmbeddings(url: string) {
    // 1. Verify environment variables
    if (!process.env.COHERE_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
        console.error("Error: Missing required environment variables.");
        return;
    }

    // 2. Load documents
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const validDocs = docs.filter(d => d.pageContent.trim().length > 0);
    
    if (validDocs.length === 0) {
        console.error("Error: No content found at the provided URL.");
        return;
    }

    // 3. Split documents
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const allSplits = await textSplitter.splitDocuments(validDocs);
    console.log(`Successfully split ${url} into ${allSplits.length} chunks.`);

    // 4. Initialize embedding model
    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    // 5. Initialize Pinecone client
    const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY,
    });

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    // 6. Embed and store in Pinecone
    try {
        console.log("Upserting chunks to Pinecone...");
        await PineconeStore.fromDocuments(allSplits, embeddings, {
            pineconeIndex,
            maxConcurrency: 5,
        });
        console.log("Documents have been successfully stored in Pinecone.");
    } catch (error) {
        console.error("Failed to upsert to Pinecone:", error);
    }
}

// Run the function
await webFileEmbeddings("https://lilianweng.github.io/posts/2023-06-23-agent/");
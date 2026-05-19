import { Document } from "langchain";
import { StateGraph,Annotation,Send } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

import { ChatOpenAI } from "@langchain/openai";

import "dotenv/config"
const loader = new CheerioWebBaseLoader("https://lilianweng.github.io/posts/2023-06-23-agent/")
const docs = await loader.load();
    
    // 3. Split documents
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
const llm = new ChatOpenAI({
    configuration: {
        baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1"
    },
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_NAME || "gpt-3.5-turbo",
});
const maxTokens = 1000

function approximateTokens(text: string) {
    return Math.ceil(text.length / 4)
}

async function lengthFunction(documents: Document[]) {
    const tokenCounts = documents.map(doc => approximateTokens(doc.pageContent))
    const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0)
    return totalTokens
}

function splitIntoDocLists(docs: Document[], maxLength: number): Document[][] {
    const docLists: Document[][] = []
    let currentList: Document[] = []
    let currentLength = 0
    
    for (const doc of docs) {
        const docLength = approximateTokens(doc.pageContent)
        if (currentLength + docLength > maxLength && currentList.length > 0) {
            docLists.push(currentList)
            currentList = [doc]
            currentLength = docLength
        } else {
            currentList.push(doc)
            currentLength += docLength
        }
    }
    
    if (currentList.length > 0) {
        docLists.push(currentList)
    }
    
    return docLists
}


  const OverallState = Annotation.Root({
  contents: Annotation<string[]>,
  // Notice here we pass a reduce function.
  // This is because we want combine all the summaries we generate
  // from individual nodes back into one list. - this is essentially
  // the "reduce" part
  summaries: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
  }),
  collapsedSummaries: Annotation<Document[]>,
  finalSummary: Annotation<string>,
});

// This will be the state of the node that we will "map" all
// documents to in order to generate summaries
interface SummaryState {
  content: string;
}

// Here we generate a summary, given a document
const createGuideChunks = async (
  state: SummaryState
): Promise<{ summaries: string[] }> => {
  const mapPrompt = ChatPromptTemplate.fromMessages([
  [
    "user",
    `Create structured study notes for the following text. Include:
- Key concepts / definitions
- Examples or illustrations
- Important points
- Format as bullet points:\n\n{context}`,
  ],
]);
  const prompt = await mapPrompt.invoke({ context: state.content });
  const response = await llm.invoke(prompt);
  return { summaries: [String(response.content)] };
};

// Here we define the logic to map out over the documents
// We will use this an edge in the graph
const distributeGuideContent = (state: typeof OverallState.State) => {
  // We will return a list of Send objects
  // Each Send object consists of the name of a node in the graph
  // as well as the state to send to that node
  return state.contents.map(
    (content) => new Send("generateSummary", { content })
  );
};


const aggregateGuideSummaries = async (state: typeof OverallState.State) => {
  return {
    collapsedSummaries: state.summaries.map(
      (summary) => new Document({ pageContent: summary })
    ),
  };
};

async function _reduce(documents: Document[]): Promise<string> {
  const docsString = documents
    .map((doc, i) => `Document ${i + 1}:\n${doc.pageContent}`)
    .join("\n\n");
  
  const prompt = await reducePrompt.invoke({ docs: docsString });
  const response = await llm.invoke(prompt);
  return String(response.content);
}

const reducePrompt = ChatPromptTemplate.fromMessages([
  [
    "user",
    `The following are study guide chunks:
{docs}
Distill these into a single cohesive study guide.
Maintain key concepts, examples, and main points.`,
  ],
]);


const mergeGuideBatches = async (state: typeof OverallState.State) => {
  const docLists = splitIntoDocLists(
    state.collapsedSummaries,
    maxTokens
  );
  const results = [];
  for (const docList of docLists) {
    results.push(await _reduce(docList));
  }
  return { collapsedSummaries: results.map(summary => new Document({ pageContent: summary })) };
};

// This represents a conditional edge in the graph that determines
// if we should collapse the summaries or not
async function needsGuideMerge(state: typeof OverallState.State) {
  let numTokens = await lengthFunction(state.collapsedSummaries);
  if (numTokens > maxTokens) {
    return "collapseSummaries";
  } else {
    return "generateFinalSummary";
  }
}
const compileGuide = async (state: typeof OverallState.State) => {
  const response = await _reduce(state.collapsedSummaries);
  return { finalSummary: response };
};

// Construct the graph
const graph = new StateGraph(OverallState)
  .addNode("createGuideChunks", createGuideChunks)
  .addNode("aggregateGuideSummaries", aggregateGuideSummaries)
  .addNode("mergeGuideBatches", mergeGuideBatches)
  .addNode("compileGuide", compileGuide)
  .addConditionalEdges("__start__", distributeGuideContent, ["createGuideChunks"])
  .addEdge("createGuideChunks", "aggregateGuideSummaries")
  .addConditionalEdges("aggregateGuideSummaries", needsGuideMerge, [
    "mergeGuideBatches",
    "compileGuide",
  ])
  .addConditionalEdges("mergeGuideBatches", needsGuideMerge, [
    "mergeGuideBatches",
    "compileGuide",
  ])
  .addEdge("compileGuide", "__end__");

const app = graph.compile();

let finalSummary = null;

for await (const step of await app.stream(
  {
    contents: splitDocs.map((doc) => doc.pageContent),
  },
  { recursionLimit: 150 }
)) {
  console.log(Object.keys(step));
  if (step.generateFinalSummary) {
    finalSummary = step.generateFinalSummary.finalSummary;
  }
}

console.log("Final summary:", finalSummary);
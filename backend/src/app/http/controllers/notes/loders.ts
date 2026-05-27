import { TextLoader } from "@langchain/classic/document_loaders/fs/text"
import {CheerioWebBaseLoader} from "@langchain/community/document_loaders/web/cheerio";
import {Document} from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {PDFLoader} from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";

/**
 * Load DOCX files
 */
export async function loadDocx(filePath: string): Promise<Document[]> {
  try {
    const { DocxLoader } = await import("@langchain/community/document_loaders/fs/docx");
    const loader = new DocxLoader(filePath);
    const docs = await loader.load();
    return docs;
  } catch (error) {
    console.warn("⚠️ DocxLoader not available, falling back to raw text");
    return [new Document({ pageContent: fs.readFileSync(filePath, "utf-8"), metadata: { source: filePath } })];
  }
}

/**
 * Load CSV files
 */
export async function loadCsv(filePath: string): Promise<Document[]> {
  try {
    const { CSVLoader } = await import("@langchain/community/document_loaders/fs/csv");
    const loader = new CSVLoader(filePath);
    const docs = await loader.load();
    return docs;
  } catch (error) {
    console.warn("⚠️ CSVLoader not available, reading as plain text");
    const content = fs.readFileSync(filePath, "utf-8");
    return [new Document({ pageContent: content, metadata: { source: filePath } })];
  }
}
export async function splitDocToChunks(
  docs: Document[],
  props: any
): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({ ...props });
  const splitDocs = await splitter.splitDocuments(docs);
  return splitDocs;
}

/**
 * Get only the first chunk of a document (for speed optimization)
 */
export function getDocChunk(docSplit: Document[]): Document[] {
  const docChunk = [];
  if (docSplit.length > 0) {
    docChunk.push(docSplit[0]);
  } else {
    throw new Error('The provided Document is empty');
  }
  return docChunk;
}
export async function loadWeb(url: string): Promise<Document[]> {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();
  return docs;
}
export async function loadPDF(filePath: string): Promise<Document[]> {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  return docs;
}
export async function loadText(filePath: string): Promise<Document[]> {
  const loader = new TextLoader(filePath);
  const docs = await loader.load();
  return docs;
}

export async function loadDocument(
  filePath: string,
  doctype: "pdf" | "html" | "txt" | "web" | "docx" | "csv",
  chunkSize = 1000,
  chunkOverlap = 200
): Promise<Document[]> {
  let docs = null;

  switch (doctype) {
    case "pdf":
      docs = await loadPDF(filePath);
      break;
    case "html":
      docs = await loadWeb(filePath);
      break;
    case "txt":
      docs = await loadText(filePath);
      break;
    case "docx":
      docs = await loadDocx(filePath);
      break;
    case "csv":
      docs = await loadCsv(filePath);
      break;
    case "web":
      docs = await loadWeb(filePath);
      break;
    default:
      throw new Error("Unsupported file type");
  }

  return splitDocToChunks(docs, { chunkSize, chunkOverlap });
}
import { Request, Response, NextFunction } from "express";
import { DocRepository } from "../repository/DocRepository";
import { generateMindMap } from "@/pipelines/mind-map";
import { generateStudyGuide } from "@/pipelines/study-guide";
import { loadDocument } from "../loders/loders";
import { LLM } from "@/app/llm/LLM";
export async function CreateOrUpdateMindMap(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, noteId }: Record<string, any> = req.query;
    const docRepo = DocRepository.getInstance();
    const doc = await docRepo.getSingleDoc({ userId, noteId });
    const llm = LLM.getInstance()

    if (!doc) {
      throw new Error('No document found');
    }

    let studyGuide = doc?.studyGuide;
    
    if (!studyGuide) {
      // Generate study guide if it doesn't exist
      if (!doc.fileName) {
        throw new Error('Document file not found to generate study guide');
      }
      
      const docFullPath = doc.fileName;
      const fileExt = doc.fileName.split('.').pop()?.toLowerCase() || 'txt';
      const docType = (fileExt as "txt" | "pdf" | "html" | "web" | "docx" | "csv") || 'txt';
      const splitDocs = await loadDocument(docFullPath, docType, 1000, 200);
      
      studyGuide = await generateStudyGuide(llm, splitDocs);
      
      // Update the doc with the newly generated study guide
      await docRepo.updateStudyGuide({ userId, noteId, studyGuide: studyGuide || '' });
    }

    const mindMap = await generateMindMap(llm, studyGuide || '');
    const storeMindMap = await docRepo.updateMindMap({ userId, noteId, mindMap })

    return res.status(200).send({ MindMap: storeMindMap });
  } catch (error) {
    next(error);
  }
}
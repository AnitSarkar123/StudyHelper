import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from '../repository/NoteRepository';
import path from 'node:path';
import { DocRepository } from '../repository/DocRepository';
import process from 'process';
import { loadDocument } from '../loders/loders';
import { LLM } from '@/app/llm/LLM';
// import { generateBrifingDoc } from '@/pipelines/brefing-doc';
import { generateFAQ } from '@/pipelines/generate-faq';
// import { generateSummary } from '@/pipelines/summary';
// import { LLM } from '@langchain/core/language_models/llms';
export async function UpdateOrCreateFAQ(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.body?.userId ?? req.query?.userId ?? (req.user as any)?._id ?? "");
        const noteId = String(req.body?.noteId ?? req.query?.noteId ?? "");

        if (!userId || !noteId) {
            throw new Error("Please provide userId and noteId");
        }

        const llm = LLM.getInstance()

        const docRepo = DocRepository.getInstance()
        const doc = await docRepo.getSingleDoc({ userId, noteId })
        if (!doc) throw new Error('No document found')

        const currentDir = process.cwd();
        const uploadsDir = path.join(currentDir, "public", "uploads");
        const fileName = String((doc as any)?.fileName ?? "").trim();
        if (!fileName) {
            throw new Error("Document file is missing for this note");
        }

        const docFullPath = path.isAbsolute(fileName) ? fileName : path.join(uploadsDir, fileName);
        const docType = path.extname(fileName).toLowerCase().slice(1) as "pdf" | "html" | "txt" | "web" | "docx" | "csv"
        const splittingDoc = await loadDocument(docFullPath, docType)
        const faq = await generateFAQ(llm, splittingDoc)
        // ensure summary is a string (generateSummary may return string | null)
        const summary: string = faq ?? ''
        await docRepo.updateSummary({ userId, noteId, summary })
        return res.status(200).json({ message: "FAQ generated and saved successfully", summary })


    } catch (error) {
        next(error)
    }
}
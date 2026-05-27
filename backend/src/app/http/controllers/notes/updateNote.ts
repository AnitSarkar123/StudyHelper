

import express from "express";
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from "./repository/NoteRepository";
import { cwd } from "process";
import path from "path";
// import { generateTitle } from "./titleGeneration";
import { generatePrompt } from "./promptGenerator";
import { generateImage } from "./generateImage";
import { LLM } from "../../../llm/LLM";
// import { loadDocument } from "./loaders";
export async function updateNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, title } = req.body;

    if (!id || !title) {
      throw new Error("Please provide the ID and Title");
    }

    const noteRepo = NoteRepository.getInstance();
    const updateNote = await noteRepo.updateNotes({ id, title });

    return res.status(200).send({ message: "Note updated successfully", updateNote });
  } catch (error) {
    next(error);
  }
}
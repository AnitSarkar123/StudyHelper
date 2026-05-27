import express from "express";
import { Express, NextFunction, Response, Request } from "express";
import { NoteRepository } from "./repository/NoteRepository";

export async function getAllNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query;

    const search = query.search as string;
    const page = parseInt(query.page as string) || 10;
    const noteRepo = NoteRepository.getInstance();
    const notes = await noteRepo.getAllNotes({ search, page, limit: 10 });

    return res.status(200).send(notes);
  } catch (error) {
    next(error);
  }
}
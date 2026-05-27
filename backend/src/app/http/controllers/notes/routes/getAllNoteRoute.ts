import { getAllNotes } from "../getAllNotes";
import { Router } from "express";

export function getAllNotesRoute(router: Router) {
    router.get("/notes", getAllNotes)
}
import { Router } from "express";
import { updateNote } from "../updateNote";


export function updateNoteRoute(router: Router) {
    router.put("/notes",updateNote)
    return router;
}
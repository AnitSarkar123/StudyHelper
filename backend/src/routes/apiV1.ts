import { driveRoutes } from "@/app/http/controllers/drive/routes/driveRoutes";
import { createNoteRoute } from "@/app/http/controllers/notes/routes/createNoteRoute";
import { getAllNotesRoute } from "@/app/http/controllers/notes/routes/getAllNoteRoute";
import { updateNoteRoute } from "@/app/http/controllers/notes/routes/updateNotesRoute";
// import { notesRoutes } from "@/app/http/controllers/notes/notesRoutes";
import { Express, Router } from "express";

export function apiV1Routes(app: Express, router: Router) {
    const apiRouter = Router();
    
    // Register drive routes
    driveRoutes(apiRouter);
    
    // Register note creation and image routes
    createNoteRoute(apiRouter);
    // notesRoutes(apiRouter);
    updateNoteRoute(apiRouter);
    getAllNotesRoute(apiRouter);
    
    app.use("/api/v1", apiRouter);
}
import { driveRoutes } from "@/app/http/controllers/drive/routes/driveRoutes";
import { createNoteRoute } from "@/app/http/controllers/notes/routes/createNoteRoute";
import { getAllNotesRoute } from "@/app/http/controllers/notes/routes/getAllNoteRoute";
import { getSummaryRoute } from "@/app/http/controllers/notes/routes/summeryRoute";
import { updateNoteRoute } from "@/app/http/controllers/notes/routes/updateNotesRoute";
import {getBriefingDocRoute} from "@/app/http/controllers/notes/routes/brifingDocRoute"
// import { notesRoutes } from "@/app/http/controllers/notes/notesRoutes";
import { Express, Router } from "express";

import { getFAQRoute } from "@/app/http/controllers/notes/routes/FAQ";
import { getStudyGuideRoute } from "@/app/http/controllers/notes/routes/studyGuide";
import { getMindmapRoute } from "@/app/http/controllers/notes/routes/mindmapRoute";

export function apiV1Routes(app: Express, router: Router) {
    const apiRouter = Router();
    
    // Register drive routes
    driveRoutes(apiRouter);
    
    // Register note creation and image routes
    createNoteRoute(apiRouter);
    // notesRoutes(apiRouter);
    updateNoteRoute(apiRouter);
    getAllNotesRoute(apiRouter);
    getSummaryRoute(apiRouter);
    // Register BriefingDoc routes
    getBriefingDocRoute(apiRouter);
    // getSummaryRoute(apiRouter)
    getStudyGuideRoute(apiRouter)
    getFAQRoute(apiRouter)
    getMindmapRoute(apiRouter)


    app.use("/api/v1", apiRouter);
}
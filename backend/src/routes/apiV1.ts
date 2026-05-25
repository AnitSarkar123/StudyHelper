import { driveRoutes } from "@/app/http/controllers/drive/routes/driveRoutes";
import { Express, Router } from "express";

export function apiV1Routes(app: Express, router: Router) {
    const apiRouter = Router();
    driveRoutes(apiRouter);
    app.use("/api/v1", apiRouter);
}
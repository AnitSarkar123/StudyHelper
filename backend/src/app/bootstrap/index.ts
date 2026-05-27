import type { Express } from "express";
import { expressServer } from "./express/expressServer";
import { connectToDatabase } from "./mongoose/dbConnection";
import agenda from "./agenda/agenda";

import "./agenda/jobs/imageJob"
export async function bootstrapApp(app: Express, PORT: number) {
  // Connect to MongoDB but don't crash if it fails
  try {
    await connectToDatabase()
  } catch (error) {
    console.error("Database connection failed, continuing without database:", error);
  }
  await agenda.start(); // Start Agenda job scheduler
  
  // Start Express server regardless
  expressServer(app, PORT)
}
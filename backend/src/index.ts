import express from "express"
import "dotenv/config"
import { bootstrapApp } from "./app/bootstrap"

const app = express();
const PORT = Number(process.env.PORT) || 8000;

// Initialize server
bootstrapApp(app, PORT).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
})


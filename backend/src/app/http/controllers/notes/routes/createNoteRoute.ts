import multer from "multer";
import path from "path";
import fs from "fs";
import { Response, Router } from "express";
import { cwd } from "process";
import { createNotes } from "../createNotes"

const currentDir = cwd();

// Ensure uploads folder exists
const uploadsDir = path.join(currentDir, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// ✅ Simple multer config - accept any file
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

export function createNoteRoute(router: Router) {
    // Multer error handler with detailed logging
    router.post("/notes", 
        (req, res, next) => {
            console.log("\n📨 REQUEST RECEIVED");
            console.log("   Headers:", req.headers);
            console.log("   Content-Type:", req.headers["content-type"]);
            
            upload.single("doc")(req, res, (err) => {
                if (err instanceof multer.MulterError) {
                    console.error("❌ Multer error:", err.message);
                    return res.status(400).json({ error: "Upload error: " + err.message });
                } else if (err) {
                    console.error("❌ Upload error:", err.message);
                    return res.status(400).json({ error: "Upload error: " + err.message });
                }
                console.log("✅ File received:", req.file ? req.file.originalname : "No file in form");
                next();
            });
        },
        createNotes
    );
    return router
}
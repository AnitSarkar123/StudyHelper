import { NextFunction, Response, Request } from "express";
import { NoteRepository } from "./repository/NoteRepository";
import path from "path";
import { generateTitle } from "./helpers/TitleGeneration";
import { generatePrompt } from "./helpers/promptGenerator";
import { generateImage } from "./helpers/generateImage";
import { loadDocument, splitDocToChunks, getDocChunk } from "./loders/loders";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { LLM } from "@/app/llm/LLM";
import mongoose from "mongoose";
import { DocRepository } from "./repository/DocRepository";
/** 
 * Create a note from an uploaded file
 * Flow: Upload File → Load & Split → Generate Title → Generate Image Prompt → Generate Image → Save to MongoDB
 */
export async function createNotes(req: Request, res: Response, next: NextFunction) {
    try {
        // 1️⃣ VALIDATE - Check if file was uploaded
        if (!req.file) {
            console.log("❌ No file found in request");
            console.log("   req.file:", req.file);
            console.log("   Content-Type:", req.headers["content-type"]);
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log("✅ File received:", req.file.originalname);
        console.log("   Size:", req.file.size);
        console.log("   Path:", req.file.path);

        // 2️⃣ GET USER - Get user ID from authenticated request
        let userId = (req.user as any)?._id;
        if (!userId) {
            console.log("⚠️ No user authenticated, creating demo ObjectId");
            // For testing: create a valid MongoDB ObjectId
            userId = new mongoose.Types.ObjectId();
            console.log("   Demo userId:", userId);
        }

        const finalUserId = userId;

        // 3️⃣ GET FILE PATH - Where the file was saved
        const filePath = req.file.path;
        const fileExtension = path.extname(req.file.originalname).toLowerCase().slice(1);
        
        // Support multiple file types
        const supportedTypes: any = { 
            pdf: "pdf", 
            txt: "txt",
            doc: "docx",
            docx: "docx",
            csv: "csv",
            html: "html"
        };

        if (!supportedTypes[fileExtension]) {
            return res.status(400).json({ error: "Unsupported file type. Supported: PDF, TXT, DOC, DOCX, CSV, HTML" });
        }

        // 4️⃣ LOAD DOCUMENT - Read and parse the file
        console.log("📖 Loading document...");
        const docType = supportedTypes[fileExtension];
        const loadedDocs = await loadDocument(filePath, docType, 1000, 200);

        if (!loadedDocs || loadedDocs.length === 0) {
            return res.status(400).json({ error: "Failed to load document content" });
        }

        // 5️⃣ SPLIT DOCUMENT - Break into chunks for processing
        console.log("✂️ Splitting document into chunks...");
        const splitDocs = await splitDocToChunks(loadedDocs, {
            chunkSize: 1000,
            chunkOverlap: 200
        });

        // 6️⃣ INITIALIZE LLM - Set up the AI model
        const llm = LLM.getInstance();
        // 7️⃣ GENERATE TITLE - AI creates a title from document (using first chunk only for speed)
        console.log("📝 Generating title from document...");
        const firstChunk = getDocChunk(splitDocs);
        const title = await generateTitle(llm, firstChunk);
        console.log("✅ Title generated:", title);

        // 8️⃣ GENERATE IMAGE PROMPT - AI creates a prompt for image generation
        console.log("🎨 Creating image generation prompt...");
        const imagePrompt = await generatePrompt(llm, title);
        console.log("✅ Image prompt created:", imagePrompt);

        // 9️⃣ GENERATE IMAGE & SAVE NOTE - Use NVIDIA AI to generate the image with callback
        console.log("🖼️ Generating image...");
        const uploadsDir = "public/uploads";
        const randomName = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        let savedNote: any;
        const imageResult = await generateImage(
            imagePrompt,
            uploadsDir,
            randomName,
            async (fileName: string) => {
                // Callback: Save note when image is ready
                const imageUrl = `${process.env.APP_URL}/uploads/${fileName}`;
                const noteRepo = NoteRepository.getInstance();
                

                savedNote = await noteRepo.createNote({
                    title: title,
                    image: imageUrl,
                    userId: finalUserId
                });
                console.log("✅ Note saved:", savedNote._id);
                return savedNote;
            }
        );
        const DocRepo = DocRepository.getInstance();
        const savedDoc = await DocRepo.createDoc({
            title,
            fileName: filePath,
            userId: finalUserId.toString(),
            noteId: savedNote._id
        })
        console.log("✅ Doc saved:", savedDoc._id);

        console.log("✅ Image generated and note saved:", imageResult.fileName);

        // 1️⃣1️⃣ RETURN SUCCESS
        res.json({
            success: true,
            message: "Note created successfully",
            data: {
                title: title,
                imageUrl: `${process.env.APP_URL}/uploads/${imageResult.fileName}`,
                noteId: savedNote._id,
                prompt: imagePrompt
            }
        });

    } catch (error) {
        console.error("❌ Error creating note:", error);
        next(error);
    }
}
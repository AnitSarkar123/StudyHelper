import agenda from "../agenda";
import { generateImage } from "../../../http/controllers/notes/generateImage";
import { NoteRepository } from "../../../http/controllers/notes/repository/NoteRepository";

agenda.define("generateImage", async (job: any) => {
  const { noteId, generateImagePrompt, uploadsDir, randomName } = job.attrs.data as any;
  console.log("🎨 Starting image generation for note:", noteId);
  
  try {
    await generateImage(
      generateImagePrompt,
      uploadsDir,
      randomName,
      async (fileName: string) => {
        console.log("✅ Image generated, updating note:", noteId);
        const noteRepo = NoteRepository.getInstance();
        const imageUrl = `${process.env.APP_URL}/uploads/${fileName}`;
        await noteRepo.updateNotes({ id: noteId, image: imageUrl });
      }
    );
  } catch (error) {
    console.error("❌ Error in image generation job:", error);
    throw error;
  }
});
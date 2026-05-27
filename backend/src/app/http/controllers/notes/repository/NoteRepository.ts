import { Note } from "@/app/models/noteSchema";
import { Types } from "mongoose";

export class NoteRepository {
    private static instance: NoteRepository;

    // singleton design pattern
    public static getInstance(): NoteRepository {
        if (!NoteRepository.instance) {
            NoteRepository.instance = new NoteRepository();
        }
        return NoteRepository.instance;
    }

    /**
     * Create a new note with image URL
     * @param props - { title: string, image: string, userId: string or ObjectId }
     */
    async createNote(props: { title?: string; name?: string; image: string; userId: string | Types.ObjectId }) {
        // Support both 'title' and 'name' for backward compatibility
        const noteTitle = props.title || props.name;
        
        const note = new Note({
            title: noteTitle,
            image: props.image,
            userId: props.userId
        });
        
        const newNote = await note.save();
        return newNote.toObject();
    }

    

    
async updateNotes(props: { id: string; title?: string; image?: string; description?: string }) {
  const updateData: any = {};
  if (props.title) updateData.title = props.title;
  if (props.image) updateData.image = props.image;
  if (props.description) updateData.description = props.description;
  
  const updateNote = await Note.findByIdAndUpdate(
    props.id,
    updateData,
    { new: true, runValidators: true }
  );

  return updateNote;
}

    /**
     * Delete a note
     */
    async deleteNote(noteId: string | Types.ObjectId) {
        const result = await Note.findByIdAndDelete(noteId);
        return result;
    }
    async getAllNotes({
  search = "",
  page = 1,
  limit = 10,
}: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {};
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
    ];
  }

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }), // newest first
    Note.countDocuments(filter),
  ]);

  return { notes, pagination:{total, page, limit, totalPages: Math.ceil(total / limit) } };
}
}
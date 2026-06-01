import { Doc } from "@/app/models/docSchema";
// import { Note } from "@/app/models/noteSchema";
import { Types } from "mongoose";

export class DocRepository {
    private static instance: DocRepository;

    // singleton design pattern
    public static getInstance(): DocRepository {
        if (!DocRepository.instance) {
            DocRepository.instance = new DocRepository();
        }
        return DocRepository.instance;
    }

    async createDoc(docProps: { title: string; fileName: string; userId: string; noteId: Types.ObjectId }) {
        const doc = new Doc({
            ...docProps
        });
        const newDoc = await doc.save();
        return newDoc.toObject();
    }
    async updateSummary(props: { userId: string, noteId: string, summary: string }) {
        const { userId, noteId } = props;
        const row = await Doc.findOneAndUpdate(
            { userId, noteId },
            { $set: { summary: props.summary } },
            { new: true, runValidators: true }
        );

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }
    async updateBriefingDoc(props: { userId: string, noteId: string, briefingDoc: string }) {
        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { briefingDoc: props.briefingDoc }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }
    async updateFaq(props: { userId: string, noteId: string, faq: string }) {
        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { faq: props.faq }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }
    async updateStudyGuide(props: { userId: string, noteId: string, studyGuide: string }) {
        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { studyGuide: props.studyGuide }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }
    async updateMindMap(props: { userId: string, noteId: string, mindMap: string }) {
        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { mindMap: props.mindMap }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }
    async getSingleDoc(props: { userId: string; noteId: string }) {
        const doc = await Doc.findOne({ userId: String(props.userId), noteId: String(props.noteId) });
        return doc;
    }

    
    



}
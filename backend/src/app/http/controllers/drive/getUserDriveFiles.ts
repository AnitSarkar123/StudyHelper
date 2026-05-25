import express from "express"
import { Request, Response ,Express,NextFunction} from "express"
import  { google } from "googleapis";

export async function getUserDriveFiles(req: Request, res: Response, next: NextFunction) {
    try{
        const user = req.user as any;
        console.log("👤 User from request:", { 
            id: user?._id, 
            email: user?.email,
            hasAccessToken: !!user?.googleAccessToken 
        });

        if (!user) {
            return res.status(401).json({ error: "Unauthorized - No user found" });
        }

        if (!user?.googleAccessToken) {
            return res.status(401).json({ error: "Unauthorized - No Google access token" });
        }

        const oauth2Client = new google.auth.OAuth2({
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            client_id: process.env.GOOGLE_CLIENT_ID
        });

        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken
        });

        const drive = google.drive({ version: "v3", auth: oauth2Client });
        const response = await drive.files.list({
            pageSize: 10,
            fields: "files(id, name, mimeType, webViewLink)"
        });

        res.json({ files: response.data.files });

    } catch(err: any) {
        console.error("❌ Error fetching Google Drive files:", err.message);
        return res.status(500).json({ error: "Failed to fetch Google Drive files" });
    }
}

import { Express, Request, Response,Router } from "express";
import cors from "cors";
import express from "express";
import { handelExpressError } from "../exceptions/handelExpressError";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "@/app/models/userSchema";
import { UserRepository } from "@/app/http/controllers/auth/repository/useRepository";
import { apiV1Routes } from "@/routes/apiV1";
import MongoStore from "connect-mongo";
export function expressServer(app: Express, PORT: number) {
    const router =Router()
     app.use(cors({
        origin:"*",
        credentials:true
    }))
    
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    app.get("/health", (req: Request, res: Response) => {
        res.status(200).json({ message: "Server is healthy" })
    })

    app.get('/', (req: Request, res: Response) => {
        res.json({ message: "Hello, World!" })
    })
    const sess = {
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_CONNECTION_STRING,
            collectionName: "sessions"
        }),
        secret: process.env.SESSION_SECRET || "default_secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false
        }
    }
    if (process.env.NODE_ENV === "production") {
        app.set('trust proxy', 1)
        sess.cookie.secure = true
    }
    app.use(session(sess))
    app.use(passport.initialize())
    app.use(passport.session())
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: process.env.GOOGLE_REDIRECT_URI!
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
                console.log("🔐 Google OAuth callback triggered");
                console.log("📦 Google profile structure:", {
                    id: profile.id,
                    displayName: profile.displayName,
                    emails: profile.emails,
                    photos: profile.photos
                });
                
                const userRepo = UserRepository.getInstance()
                const userResult = await userRepo.createUser(profile, { accessToken, refreshToken })
                console.log("✅ User created/found:", userResult?.authData?.email);
                
                // Return just the user data (without authData wrapper) for Passport
                return done(null, userResult?.authData)
            } catch (error: any) {
                console.error("❌ Error in Google OAuth callback:", error.message);
                console.error("   Stack:", error.stack);
                return done(error)
            }
        }
    ))
    passport.serializeUser((user: any, done) => {
        console.log("📤 Serializing user:", user?._id);
        done(null, user?._id);
    })
    passport.deserializeUser(async (userId: any, done) => {
        try {
            console.log("📥 Deserializing user:", userId);
            const user = await User.findById(userId);
            done(null, user);
        } catch (err) {
            console.error("❌ Error deserializing user:", err);
            done(err);
        }
    });
    app.get('/auth/google',
        passport.authenticate("google", { 
            scope: [
                'profile', 
                'email',
                "https://www.googleapis.com/auth/drive.metadata.readonly",
                "https://www.googleapis.com/auth/drive.file"
            ],
            accessType: 'offline',
            prompt: 'consent'
         })   
    )

    app.get("/auth/google/callback",
        passport.authenticate("google", { 
            failureRedirect: "/auth/login",
            failureMessage: true
        }),
        async (req: Request, res: Response) => {
            try {
                console.log("✨ OAuth callback successful, user:", (req.user as any)?._id);
                
                // Get fresh tokens for the user
                const userRepo = UserRepository.getInstance();
                const { generateTokens } = await import("@/app/helpers/jwt");
                const { accessToken, refreshToken } = await generateTokens((req.user as any)?._id);
                
                // Redirect to frontend with tokens in query params
                const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}?accessToken=${accessToken}&refreshToken=${refreshToken}`;
                res.redirect(redirectUrl);
            } catch (error: any) {
                console.error("❌ Error in callback handler:", error.message);
                res.status(500).json({ error: error.message });
            }
        }
    )
    app.get("/auth/me", (req: Request, res: Response) => {
       if (!req.user) {
        return res.status(401).json({ message: "Not authenticated/logged in" })
       }
       res.json({ user: req.user })
    })
    apiV1Routes(app,router)

    // Error handling middleware - MUST be after all routes
    app.use(handelExpressError)

    app.listen(PORT, () => {
        console.log(`Server is running on port http://localhost:${PORT}`);
    })

}
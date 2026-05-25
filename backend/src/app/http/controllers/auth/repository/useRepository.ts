import { GoogleUserType } from "@/types/user-types";
import { User } from "../../../../models/userSchema";
import { exists } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_control";
import { generateTokens, signAccessToken, signRefreshToken } from "@/app/helpers/jwt";

export class UserRepository {
    private static instance: UserRepository;

    // singleton design pattern
    public static getInstance(): UserRepository {
        if (!UserRepository.instance) {
            UserRepository.instance = new UserRepository();
        }
        return UserRepository.instance;
    }
    async createUser(userProps: GoogleUserType, token: { accessToken: string, refreshToken: string }) {
        try {
            console.log("📝 createUser called with profile:", {
                name: userProps?._json?.name,
                email: userProps?._json?.email,
                picture: userProps?._json?.picture,
                sub: userProps?._json?.sub
            });

            const { sub: id, name, picture, email } = userProps?._json;
            
            if (!email) {
                throw new Error("❌ Email not found in Google profile");
            }
            if (!id) {
                throw new Error("❌ Google ID (sub) not found in Google profile");
            }

            console.log(`🔍 Checking if user exists with email: ${email}`);
            const existsUser = await User.findOne({ email: email });
            
            if (!existsUser) {
                console.log("➕ Creating new user...");
                const user = new User({
                    name: name,
                    email: email,
                    image: picture,
                    googleAccessToken: token?.accessToken,
                    googleRefreshToken: token?.refreshToken,
                    googleId: id
                });

                console.log("💾 Saving user to MongoDB...");
                const newUser = await user.save();
                console.log("✅ User saved successfully:", newUser._id);
                
                const { accessToken, refreshToken } = await generateTokens(newUser?._id);
                return {
                    authData: {
                        ...newUser.toObject(),
                        token: {
                            accessToken,
                            refreshToken
                        }
                    }
                };
            } else {
                console.log("👤 User already exists:", existsUser._id);
                const { accessToken, refreshToken } = await generateTokens(existsUser._id);
                return {
                    authData: {
                        ...existsUser.toObject(),
                        token: {
                            accessToken,
                            refreshToken
                        }
                    }
                };
            }
        } catch (error: any) {
            console.error("❌ Error in createUser:", error.message);
            console.error("Stack:", error.stack);
            throw error;
        }
    }
}
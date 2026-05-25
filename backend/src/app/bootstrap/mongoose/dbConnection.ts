import mongoose from "mongoose";
import dns from "dns";

// Force DNS to use Google's public DNS (8.8.8.8) which has better SRV record support
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
dns.setDefaultResultOrder('ipv4first');

export async function connectToDatabase() {
    try {
        if (!process.env.MONGODB_CONNECTION_STRING) {
            console.warn("⚠️ MONGODB_CONNECTION_STRING not set in .env file");
            return;
        }

        console.log("🔄 Attempting to connect to MongoDB...");
        console.log("   Using Google DNS (8.8.8.8) for SRV lookup");
        
        // Try to connect with increased retries
        let lastError: any;
        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                console.log(`   Attempt ${attempt}/5...`);
                await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string, {
                    connectTimeoutMS: 15000,
                    socketTimeoutMS: 15000,
                    serverSelectionTimeoutMS: 15000,
                    retryWrites: true,
                    ssl: true,
                    authSource: 'admin',
                    maxPoolSize: 10,
                    minPoolSize: 2,
                });
                
                console.log("✅ Connected to MongoDB successfully!");
                return;
            } catch (error: any) {
                lastError = error;
                if (attempt < 5) {
                    console.log(`   Attempt ${attempt} failed, waiting 3 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
        
        throw lastError;
    } catch (error: any) {
        console.error("❌ Error connecting to MongoDB:");
        console.error(`   Message: ${error.message}`);
        
        console.log("⚠️ Server continuing without MongoDB connection");
    }
}
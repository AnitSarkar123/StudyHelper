import fetch from "node-fetch"
import fs from "fs"
import path from "path"

/**
 * Generate an image from a text prompt using NVIDIA API and save locally
 * @param prompt - The text description of the image to generate
 * @param uploadsDir - Directory to save the image
 * @param randomName - Random filename without extension
 * @param onSave - Callback when image is saved
 */
export async function generateImage(prompt: string, uploadsDir: string, randomName: string, onSave: (fileName: string) => Promise<void>) {
    try {
        console.log("🎨 Generating image with prompt:", prompt)
        
        // 1️⃣ SETUP - Get API key and prepare headers
        const apiKey = process.env.LLM_API_KEY
        if (!apiKey) {
            throw new Error("❌ NVIDIA_API_KEY not set in .env")
        }

        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }

        // 2️⃣ REQUEST PAYLOAD - What to send to NVIDIA
        const payload = {
            prompt: prompt,
            width: 1024,
            height: 1024,
            seed: Math.floor(Math.random() * 10000),
            steps: 4
        }

        // 3️⃣ CALL NVIDIA API - Generate the image
        const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b"
        const response = await fetch(invokeUrl, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: headers
        })

        // 4️⃣ CHECK FOR ERRORS
        if (response.status !== 200) {
            const errBody = await response.text()
            throw new Error(`API Error: ${response.status} - ${errBody}`)
        }

        // 5️⃣ GET IMAGE FROM RESPONSE
        const responseBody: any = await response.json()
        console.log("📦 API Response:", JSON.stringify(responseBody).substring(0, 200));
        
        // Check if request was filtered or failed
        const artifact = responseBody?.artifacts?.[0];
        if (artifact?.finishReason && artifact.finishReason !== "SUCCESS") {
            console.error("❌ API Request failed with reason:", artifact.finishReason);
            throw new Error(`Image generation failed: ${artifact.finishReason}. Try a simpler prompt.`);
        }
        
        // NVIDIA returns image in artifacts[0].base64
        let imageUrl = artifact?.base64;

        if (!imageUrl || imageUrl === "") {
            // Try other formats as fallback
            imageUrl = responseBody?.image_url || 
                       responseBody?.image || 
                       responseBody?.data?.[0]?.url ||
                       responseBody?.result?.image_url;
        }

        if (!imageUrl || imageUrl === "") {
            console.error("❌ Response structure:", responseBody);
            throw new Error(`No image in response. Got: ${JSON.stringify(responseBody).substring(0, 300)}`);
        }

        console.log("✅ Image generated successfully!");
        console.log("📷 Image URL type:", typeof imageUrl);
        console.log("📷 Image URL preview:", String(imageUrl).substring(0, 100) + "...");

        // 6️⃣ DECODE BASE64 OR DOWNLOAD IMAGE
        let imageBuffer: any;
        
        if (typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
            // Handle base64 encoded image with data URI
            console.log("📊 Decoding base64 image with data URI...");
            const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
            imageBuffer = Buffer.from(base64Data, "base64");
        } else if (typeof imageUrl === "string" && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
            // Handle URL
            console.log("🌐 Downloading image from URL...");
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.status !== 200) {
                throw new Error(`Failed to download image: ${imageResponse.status}`);
            }
            imageBuffer = await imageResponse.buffer();
        } else if (typeof imageUrl === "string") {
            // Raw base64 string from NVIDIA (fallback for anything else)
            console.log("📊 Treating as raw base64 image from NVIDIA...");
            imageBuffer = Buffer.from(imageUrl, "base64");
        } else {
            console.error("❌ Invalid image format - imageUrl is:", imageUrl);
            throw new Error("Invalid image format in response");
        }

        // 7️⃣ SAVE IMAGE LOCALLY
        const fileName = `${randomName}.png`
        const filePath = path.join(uploadsDir, fileName)
        fs.writeFileSync(filePath, imageBuffer)
        console.log(`✅ Image saved to: ${filePath}`)

        // 8️⃣ CALL CALLBACK WITH FILENAME
        await onSave(fileName)

        return {
            success: true,
            fileName: fileName,
            prompt: prompt,
            timestamp: new Date().toISOString()
        }

    } catch (error: any) {
        console.error("❌ Error generating image:", error.message)
        throw error
    }
}
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./apps/web/.env.local') });

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

async function testGeminiSDK() {
    console.log("Testing Gemini API via Official SDK...");
    if (!GEMINI_API_KEY) {
        console.error("API Key missing!");
        return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
        const result = await model.generateContent("Reply with only the word 'ACTIVE'.");
        const response = await result.response;
        const text = response.text();
        console.log("Result:", text);
        if (text.trim().toUpperCase().includes("ACTIVE")) {
            console.log("\n✅ AI SDK VERIFIED: Gemini is responding correctly.");
        } else {
            console.log("\n⚠️ AI RESPONSE UNEXPECTED: ", text);
        }
    } catch (e: any) {
        console.error("\n❌ AI SDK FAILED: ", e.message);
    }
}

testGeminiSDK();

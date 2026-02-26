import { getGeminiCompletion } from './apps/web/lib/gemini.js';
import dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

async function testGemini() {
    console.log("Testing Gemini API Connectivity...");
    const result = await getGeminiCompletion("Reply with only the word 'OK' if you can read this.");
    console.log("Result:", result);
    if (result.trim().toUpperCase().includes("OK")) {
        console.log("✅ Gemini API Connectivity Verified!");
    } else {
        console.log("❌ Gemini API Test Failed.");
    }
}

testGemini().catch(console.error);

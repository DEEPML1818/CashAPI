import { getGeminiCompletion } from './apps/web/lib/gemini.ts';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./apps/web/.env.local') });

async function testGemini() {
    console.log("Testing Gemini API Connectivity via ts-node...");
    try {
        const result = await getGeminiCompletion("Reply with only the word 'READY' if you can read this.");
        console.log("Result:", result);
        if (result.trim().toUpperCase().includes("READY")) {
            console.log("\n✅ AI FULFILLMENT VERIFIED: Gemini is responding correctly.");
        } else {
            console.log("\n⚠️ AI RESPONSE UNEXPECTED: ", result);
        }
    } catch (e: any) {
        console.error("\n❌ AI FULFILLMENT FAILED: ", e.message);
    }
}

testGemini();

import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cashApiMiddleware } from '../../packages/middleware/index.ts';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// --- Production Configuration ---
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyC907a2kIz0GiM9KhO611I7R4M34xwlEfw";
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || 'bitcoincash:qpm2qavt7wjq73p8u0tmsv55p57m9au48pgshqv6a2';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * PRODUCTION-READY AI AGENT ENDPOINT
 * 
 * This endpoint is gated by the x402 CashApi Middleware.
 * Requests will ONLY reach the handler if a valid BCH 0-conf payment is verified.
 */
app.post('/api/ai/sentiment', cashApiMiddleware({
    address: MERCHANT_ADDRESS,
    priceSats: 1000,
    network: 'chipnet', // Use 'mainnet' for real production
    discovery: {
        enabled: true,
        name: "Enterprise Sentiment AI (BCH-Powered)"
    }
}), async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Missing 'text' field in request body." });
        }

        // 1. Get Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 2. Add System Prompt for context
        const prompt = `You are a high-performance sentiment analysis agent. 
                       Analyze the following text and provide a JSON response with:
                       - sentiment: (positive/negative/neutral)
                       - score: (0 to 1)
                       - reasoning: (brief explanation)
                       
                       Text: "${text}"`;

        // 3. Generate Content (Fulfillment)
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResult = response.text();

        // 4. Return Success with AI Result and Payment Proof
        res.json({
            status: "Success",
            fulfillment: {
                agent: "EnterpriseSentiment_v1",
                result: aiResult
            },
            payment: (req as any).cashapi // Contains { txId, amount, address }
        });

    } catch (error: any) {
        console.error("AI Fulfillment Error:", error);
        res.status(500).json({
            error: "Fulfillment Failed",
            details: "The payment was verified, but the AI service encountered an error. Please contact support with your TXID."
        });
    }
});

app.get('/', (req, res) => {
    res.send(`
        <h1>BCH x402 Production AI Server</h1>
        <p>Status: ONLINE</p>
        <p>Merchant: ${MERCHANT_ADDRESS}</p>
        <p>Discovery: <a href="/.well-known/402.json">/.well-known/402.json</a></p>
    `);
});

app.listen(PORT, () => {
    console.log(`\n🚀 Production AI Agent Server running at http://localhost:${PORT}`);
    console.log(`📡 BCH Network: chipnet`);
    console.log(`💰 Price: 1000 sats`);
});

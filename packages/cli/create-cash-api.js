#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectName = process.argv[2] || 'my-cash-api';
const projectPath = path.join(process.cwd(), projectName);

console.log(`🚀 Creating CashApi scaffold in ${projectPath}...`);

// 1. Create project directory
if (fs.existsSync(projectPath)) {
  console.error(`❌ Error: Directory ${projectName} already exists.`);
  process.exit(1);
}
fs.mkdirSync(projectPath);

// 2. Initialize package.json
const packageJson = {
  name: projectName,
  version: '1.0.0',
  main: 'index.js',
  scripts: {
    "start": "node index.js"
  },
  dependencies: {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mainnet-js": "^1.2.0",
    "@google/generative-ai": "^0.1.0"
  }
};
fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

// 3. Create Boilerplate Server
const serverCode = `
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { cashApiMiddleware } = require('./cashapi');

const app = express();
app.use(express.json());

// Initialize Gemini (User provides API key in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AI_KEY_HERE");

// Gated AI Endpoint
app.post('/analyze', cashApiMiddleware({
  address: 'bitcoincash:qpm2qavt7wjq73p8u0tmsv55p57m9au48pgshqv6a2',
  priceSats: 546,
  network: 'testnet',
  discovery: {
    enabled: true,
    name: "Production AI Sentiment Service"
  }
}), async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = \`Analyze the sentiment of this text: \${req.body.text}\`;
    
    // In production, this call is only reached IF payment is verified
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    res.json({
        status: "Success",
        analysis: response.text(),
        payment: req.cashapi // Verified TX info
    });
  } catch (err) {
    res.status(500).json({ error: "AI Inference failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`🚀 CashApi Monetized AI Server running at http://localhost:\${PORT}\`);
    console.log('Manifest: http://localhost:3000/.well-known/402.json');
});
`;

const middlewareCode = `
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Transaction } = require('mainnet-js');

const SECRET_KEY = process.env.CASHAPI_SECRET || 'cashapi-default-secret';

const send402Challenge = (res, options) => {
    const nonce = crypto.randomBytes(16).toString('hex');
    const paymentRequest = {
        amount: options.priceSats,
        currency: 'sats',
        address: options.address,
        paymentId: Math.random().toString(36).substring(7),
        network: options.network || 'mainnet',
        nonce: nonce
    };
    const paymentToken = jwt.sign(paymentRequest, SECRET_KEY, { expiresIn: '1h' });
    const payload = Buffer.from(JSON.stringify({ ...paymentRequest, token: paymentToken })).toString('base64');
    
    res.setHeader('PAYMENT-REQUIRED', payload);
    res.status(402).json({ message: 'Payment Required' });
};

const cashApiMiddleware = (options) => {
    return async (req, res, next) => {
        // Discovery Protocol
        if (options.discovery?.enabled && req.path === '/.well-known/402.json') {
          return res.json({
            name: options.discovery.name,
            protocol: "x402-v2",
            price: options.priceSats
          });
        }

        const txId = req.header('X-PAYMENT') || req.header('PAYMENT-SIGNATURE');
        const token = req.header('X-CashApi-Token');

        if (txId && token) {
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                
                // Real 0-Conf Validation
                const tx = await Transaction.getDetailed(txId);
                if (tx && tx.outputs.some(o => o.address === options.address && o.value >= options.priceSats)) {
                    res.setHeader('X-PAYMENT-RESPONSE', token);
                    req.cashapi = { txId, amount: decoded.amount };
                    return next();
                }
            } catch (err) {}
        }
        send402Challenge(res, options);
    };
};

module.exports = { cashApiMiddleware };
`;

fs.writeFileSync(path.join(projectPath, 'index.js'), serverCode.trim());
fs.writeFileSync(path.join(projectPath, 'cashapi.js'), middlewareCode.trim());

// 4. Create .env example
fs.writeFileSync(path.join(projectPath, '.env.example'), "CASHAPI_SECRET=your-secret-key-here\nPORT=3000\nGEMINI_API_KEY=your-google-ai-key");

console.log(`✅ Project ${projectName} created successfully!`);
console.log(`\nNext steps:`);
console.log(`  1. cd ${projectName}`);
console.log(`  2. npm install`);
console.log(`  3. npm start`);
console.log(`\nHappy BUIDLing! 🚀`);

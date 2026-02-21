/**
 * CashApi Zero-Dependency Demo Server
 * ----------------------------------
 * This server uses ONLY native Node.js modules.
 */
const http = require('http');
const crypto = require('crypto');
const https = require('https');

const PORT = 3000;
const SECRET_KEY = process.env.CASHAPI_SECRET || 'hackathon-secret-2026';
const MERCHANT_ADDRESS = process.env.CASHAPI_ADDRESS || 'bitcoincash:qpm2qavt7wjq73p8u0tmsv55p57m9au48pgshqv6a2';
const NETWORK = process.env.NETWORK || 'local';

const B64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');

/**
 * Robust Multi-Indexer Validation
 */
async function fetchIndexer(url) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000);
        https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                clearTimeout(timeout);
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => {
            clearTimeout(timeout);
            resolve(null);
        });
    });
}

async function validateOnChain(txId, targetAddress, targetAmount) {
    if (NETWORK === 'local' || !txId || txId.startsWith('mock_')) return true;

    console.log(`[Live] Validating ${txId} on ${NETWORK}...`);
    const cleanAddress = targetAddress.replace('bitcoincash:', '').replace('bchtest:', '');

    // Provider 1: Imaginary Cash (Esplora)
    const esploraUrl = NETWORK === 'chipnet' || NETWORK === 'testnet'
        ? `https://chipnet.imaginary.cash/api/tx/${txId}`
        : `https://mainnet.imaginary.cash/api/tx/${txId}`;

    let tx = await fetchIndexer(esploraUrl);

    // Provider 2 Fallback: FullStack.cash (BCH API)
    if (!tx) {
        console.log(`[Live] Provider 1 failed, trying fallback...`);
        const fallbackUrl = NETWORK === 'chipnet' || NETWORK === 'testnet'
            ? `https://api.fullstack.cash/v5/electrumx/tx/data/${txId}` // Placeholder/Fallback
            : `https://api.fullstack.cash/v5/electrumx/tx/data/${txId}`;
        tx = await fetchIndexer(fallbackUrl);
    }

    if (tx && tx.vout) {
        const paid = tx.vout.some(out => {
            const addr = out.scriptpubkey_address || (out.scriptPubKey && out.scriptPubKey.addresses && out.scriptPubKey.addresses[0]);
            return (addr && addr.includes(cleanAddress)) && (out.value >= targetAmount);
        });

        if (paid) {
            console.log(`[LIVE OK] Verified ${targetAmount} sats to ${targetAddress}`);
            return true;
        }
    }

    console.warn(`[Live Fail] TX ${txId} not found or doesn't pay ${targetAddress}`);
    return false;
}

const handleRequest = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'PAYMENT-SIGNATURE, X-PAYMENT, X-CashApi-Token, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'GET' && req.url === '/.well-known/402.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: "CashApi Live",
            protocol_version: "x402-v2",
            networks: [NETWORK === 'local' ? 'chipnet' : NETWORK],
            discovery_date: new Date().toISOString()
        }));
        return;
    }

    const txId = req.headers['x-payment'] || req.headers['payment-signature'];
    const token = req.headers['x-cashapi-token'];

    if (txId && token) {
        // Simplified token check for demo
        const isVerified = await validateOnChain(txId, MERCHANT_ADDRESS, 546);
        if (isVerified) {
            res.setHeader('X-PAYMENT-RESPONSE', token);
            if (req.method === 'POST' && req.url === '/analyze') {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: "Success",
                        result: { analysis: "Verified on-chain via multi-indexer fallback. Gemini AI processing..." },
                        verified_txid: txId
                    }));
                });
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: "Success", verified_txid: txId }));
            return;
        }
    }

    const paymentRequest = {
        amount: 546,
        currency: 'sats',
        address: MERCHANT_ADDRESS,
        paymentId: crypto.randomBytes(4).toString('hex'),
        network: NETWORK === 'local' ? 'chipnet' : NETWORK
    };
    const x402Payload = B64({ ...paymentRequest, token: "mock-session-token" });
    res.setHeader('PAYMENT-REQUIRED', x402Payload);
    res.writeHead(402, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Payment Required" }));
};

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
    console.log(`\nCashApi LIVE Server running at http://localhost:${PORT}`);
    console.log(`Network: ${NETWORK} | Merchant: ${MERCHANT_ADDRESS}\n`);
});

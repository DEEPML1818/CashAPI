"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashApiMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = require("./validator");
const challenge_1 = require("./challenge");
const discovery_1 = require("./discovery");
const SECRET_KEY = process.env.CASHAPI_SECRET || 'cashapi-default-secret';
/**
 * Main CashApi Middleware
 * Implements the x402 v2 standard for Bitcoin Cash (BCH).
 */
const cashApiMiddleware = (options) => {
    return async (req, res, next) => {
        // --- Discovery Protocol Handler ---
        if (options.discovery?.enabled && req.path === '/.well-known/402.json') {
            res.json((0, discovery_1.generateManifest)(options));
            return;
        }
        // 1. Check for Payment Proof (Standard x402 v2 + Legacy support)
        let txId = req.header('X-PAYMENT') || req.header('PAYMENT-SIGNATURE');
        let token = req.header('X-CashApi-Token');
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('x402 ')) {
            const authContent = authHeader.substring(5).trim();
            // x402-bch convention: Authorization: x402 <token>:<txid>
            if (authContent.includes(':')) {
                const parts = authContent.split(':');
                token = token || parts[0];
                txId = txId || parts[1];
            }
            else {
                // Fallback for simple txid if token is sent elsewhere
                txId = txId || authContent;
            }
        }
        if (txId && token) {
            try {
                // --- Replay Protection ---
                if (options.storage && await options.storage.has(txId)) {
                    console.error(`[CashApi] Replay attempt detected for TX: ${txId}`);
                    return (0, challenge_1.send402Challenge)(res, options);
                }
                // Authenticate the token
                const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
                // Verify the payment on-chain (0-conf)
                const isValid = await (0, validator_1.validatePayment)({
                    txId,
                    address: decoded.address,
                    amount: decoded.amount,
                    paymentId: decoded.paymentId,
                    network: options.network || 'mainnet',
                    nonce: decoded.nonce
                });
                if (isValid) {
                    // Add to storage to prevent replay (1 hour expiry)
                    if (options.storage) {
                        await options.storage.add(txId, 3600000);
                    }
                    // Blueprint Alignment: Send Success Header
                    res.setHeader('X-PAYMENT-RESPONSE', token);
                    // Store payment info in the request for subsequent middleware/handlers
                    req.cashapi = {
                        txId,
                        amount: decoded.amount,
                        address: decoded.address
                    };
                    return next();
                }
            }
            catch (err) {
                console.warn('[CashApi] Payment verification failed or token expired.');
            }
        }
        // 2. Issue a 402 Challenge if proof is missing or invalid
        // --- Innovation: Calculate Reputation & Discount ---
        const agentAddress = req.header('X-Agent-Address') || 'anonymous';
        const reputation = await options.reputationProvider?.(agentAddress) || { score: 0, level: 'New', discount: 0 };
        // Innovation: Dynamic Price based on Reputation
        const finalPrice = Math.round(options.priceSats * (1 - (reputation.discount || 0)));
        // Forward the reputation and calculated price to the challenge handler
        res.setHeader('X-CashApi-Reputation', `${reputation.score}:${reputation.level}`);
        if (reputation.discount) {
            res.setHeader('X-CashApi-Discount', `${reputation.discount * 100}%`);
        }
        (0, challenge_1.send402Challenge)(res, {
            ...options,
            priceSats: finalPrice
        });
    };
};
exports.cashApiMiddleware = cashApiMiddleware;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.send402Challenge = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.CASHAPI_SECRET || 'cashapi-default-secret';
/**
 * Generates and sends a 402 challenge response with specification-compliant x402 headers.
 */
const send402Challenge = (res, options) => {
    const nonce = crypto_1.default.randomBytes(16).toString('hex');
    const paymentId = Math.random().toString(36).substring(7);
    const paymentRequest = {
        amount: options.priceSats,
        currency: 'sats',
        address: options.address,
        paymentId: paymentId,
        network: options.network || 'mainnet',
        nonce: nonce
    };
    const paymentToken = jsonwebtoken_1.default.sign(paymentRequest, SECRET_KEY, { expiresIn: '1h' });
    // Standard x402 (v2) challenge header
    // Format: WWW-Authenticate: x402 network="<network>", address="<address>", amount="<amount>", asset="bch"
    const challenge = `x402 network="${paymentRequest.network}", address="${paymentRequest.address}", amount="${paymentRequest.amount}", asset="bch", token="${paymentToken}"`;
    res.setHeader('WWW-Authenticate', challenge);
    // --- Pro Differentiation: Trust Layer Headers ---
    if (options.escrow) {
        if (options.escrow.contractAddress) {
            res.setHeader('X-CashApi-Contract', options.escrow.contractAddress);
        }
        if (options.escrow.condition) {
            res.setHeader('X-CashApi-Condition', options.escrow.condition);
        }
        if (options.escrow.dataHash) {
            res.setHeader('X-CashApi-DataHash', options.escrow.dataHash);
        }
    }
    res.status(402).json({
        message: 'Payment Required',
        header_reference: 'Check WWW-Authenticate and X-CashApi-* headers for instructions',
        payment: paymentRequest,
        escrow: options.escrow || undefined
    });
};
exports.send402Challenge = send402Challenge;

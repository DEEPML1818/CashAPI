import { Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { CashApiOptions, CashApiPaymentRequest } from './types';

const SECRET_KEY = process.env.CASHAPI_SECRET || 'cashapi-default-secret';

/**
 * Generates and sends a 402 challenge response with x402 headers.
 */
export const send402Challenge = (res: Response, options: CashApiOptions) => {
    const nonce = crypto.randomBytes(16).toString('hex');
    const paymentId = Math.random().toString(36).substring(7);

    const paymentRequest: CashApiPaymentRequest = {
        amount: options.priceSats,
        currency: 'sats',
        address: options.address,
        paymentId: paymentId,
        network: options.network || 'mainnet',
        nonce: nonce
    };

    const paymentToken = jwt.sign(paymentRequest, SECRET_KEY, { expiresIn: '1h' });

    const x402Payload = Buffer.from(JSON.stringify({
        ...paymentRequest,
        token: paymentToken
    })).toString('base64');

    res.setHeader('PAYMENT-REQUIRED', x402Payload);
    res.status(402).json({
        message: 'Payment Required',
        header_reference: 'Check PAYMENT-REQUIRED header for instructions'
    });
};

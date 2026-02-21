import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CashApiOptions, CashApiPaymentRequest } from './types';
import { validatePayment } from './validator';
import { send402Challenge } from './challenge';
import { generateManifest } from './discovery';

const SECRET_KEY = process.env.CASHAPI_SECRET || 'cashapi-default-secret';

/**
 * Main CashApi Middleware
 * Implements the x402 v2 standard for Bitcoin Cash (BCH).
 */
export const cashApiMiddleware = (options: CashApiOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // --- Discovery Protocol Handler ---
    if (options.discovery?.enabled && req.path === '/.well-known/402.json') {
      res.json(generateManifest(options));
      return;
    }

    // 1. Check for Payment Proof (Standard & Blueprint Headers)
    const txId = req.header('X-PAYMENT') || req.header('PAYMENT-SIGNATURE');
    const token = req.header('X-CashApi-Token');

    if (txId && token) {
      try {
        // --- Replay Protection ---
        if (options.storage && await options.storage.has(txId)) {
          console.error(`[CashApi] Replay attempt detected for TX: ${txId}`);
          return send402Challenge(res, options);
        }

        // Authenticate the token
        const decoded = jwt.verify(token, SECRET_KEY) as CashApiPaymentRequest;

        // Verify the payment on-chain (0-conf)
        const isValid = await validatePayment({
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
          (req as any).cashapi = {
            txId,
            amount: decoded.amount,
            address: decoded.address
          };
          return next();
        }
      } catch (err) {
        console.warn('[CashApi] Payment verification failed or token expired.');
      }
    }

    // 2. Issue a 402 Challenge if proof is missing or invalid
    send402Challenge(res, options);
  };
};

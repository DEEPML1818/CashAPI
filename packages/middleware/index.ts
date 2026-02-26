import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { CashApiOptions, CashApiPaymentRequest } from './types.ts';
import { validatePayment } from './validator.ts';
import { send402Challenge } from './challenge.ts';
import { generateManifest } from './discovery.ts';

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
      } else {
        // Fallback for simple txid if token is sent elsewhere
        txId = txId || authContent;
      }
    }

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

    send402Challenge(res, {
      ...options,
      priceSats: finalPrice
    });
  };
};

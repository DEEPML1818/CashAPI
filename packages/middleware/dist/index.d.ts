import { Request, Response, NextFunction } from 'express';
import { CashApiOptions } from './types';
/**
 * Main CashApi Middleware
 * Implements the x402 v2 standard for Bitcoin Cash (BCH).
 */
export declare const cashApiMiddleware: (options: CashApiOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;

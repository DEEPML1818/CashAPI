import { Response } from 'express';
import { CashApiOptions } from './types';
/**
 * Generates and sends a 402 challenge response with specification-compliant x402 headers.
 */
export declare const send402Challenge: (res: Response, options: CashApiOptions) => void;

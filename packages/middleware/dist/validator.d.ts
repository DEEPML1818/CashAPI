import { ValidationParams } from './types';
/**
 * Validates a payment on the BCH blockchain using Electrum providers.
 */
export declare const validatePayment: (params: ValidationParams) => Promise<boolean>;

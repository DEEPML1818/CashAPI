import { PaymentStorage } from './storage';

export interface CatalogEntry {
    method: string;
    price: number;
    currency: string;
    description: string;
}

export interface DiscoveryOptions {
    enabled: boolean;
    name?: string;
    endpoints?: Record<string, CatalogEntry>;
}

export interface CashApiOptions {
    address: string;
    priceSats: number;
    network?: 'mainnet' | 'chipnet' | 'regtest';
    discovery?: DiscoveryOptions;
    storage?: PaymentStorage;
}

export interface CashApiPaymentRequest {
    amount: number;
    currency: string;
    address: string;
    paymentId: string;
    network: string;
    nonce: string; // Anti-replay nonce
}

export interface ValidationParams {
    txId: string;
    address: string;
    amount: number;
    paymentId: string;
    network: string;
    nonce: string;
}

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
export interface CashApiEscrowOptions {
    contractAddress?: string;
    dataHash?: string;
    condition?: string;
    payoutAmount?: number;
}
export interface CashApiOptions {
    address: string;
    priceSats: number;
    network?: 'mainnet' | 'chipnet' | 'regtest';
    discovery?: DiscoveryOptions;
    storage?: PaymentStorage;
    escrow?: CashApiEscrowOptions;
    agentMetadata?: Record<string, any>;
    reputationProvider?: (address: string) => Promise<AgentReputation>;
}
export interface CashApiPaymentRequest {
    amount: number;
    currency: string;
    address: string;
    paymentId: string;
    network: string;
    nonce: string;
}
export interface ValidationParams {
    txId: string;
    address: string;
    amount: number;
    paymentId: string;
    network: string;
    nonce: string;
    bid?: number;
}
export interface AgentReputation {
    score: number;
    level: 'New' | 'Trusted' | 'Elite';
    discount?: number;
}

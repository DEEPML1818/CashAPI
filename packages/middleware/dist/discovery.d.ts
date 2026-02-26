import { CashApiOptions } from './types';
/**
 * Generates the .well-known/402.json manifest
 */
export declare const generateManifest: (options: CashApiOptions) => {
    name: string;
    protocol_version: string;
    endpoints: Record<string, import("./types").CatalogEntry>;
    networks: ("mainnet" | "chipnet" | "regtest")[];
    features: {
        "x402-bch-escrow": boolean;
        "x402-bch-jwt": boolean;
    };
    agent_hints: Record<string, any>;
    discovery_date: string;
};

import { CashApiOptions } from './types';

/**
 * Generates the .well-known/402.json manifest
 */
export const generateManifest = (options: CashApiOptions) => {
    return {
        name: options.discovery?.name || "CashApi Service",
        protocol_version: "x402-v2",
        endpoints: options.discovery?.endpoints || {
            "/api": {
                method: "ANY",
                price: options.priceSats,
                currency: "sats",
                description: "Protected API Access"
            }
        },
        networks: [options.network || "mainnet"],
        discovery_date: new Date().toISOString()
    };
};

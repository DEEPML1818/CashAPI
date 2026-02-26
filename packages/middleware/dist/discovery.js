"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateManifest = void 0;
/**
 * Generates the .well-known/402.json manifest
 */
const generateManifest = (options) => {
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
        features: {
            "x402-bch-escrow": !!options.escrow,
            "x402-bch-jwt": true
        },
        agent_hints: options.agentMetadata || {
            "preferred_wallet": "CashApi-Vault",
            "trust_model": "covenant"
        },
        discovery_date: new Date().toISOString()
    };
};
exports.generateManifest = generateManifest;

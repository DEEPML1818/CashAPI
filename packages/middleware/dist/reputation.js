"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentReputation = void 0;
/**
 * Mock reputation service.
 * In a production environment, this would query a blockchain indexer
 * to count successful contract settlements for an address.
 */
const getAgentReputation = async (address) => {
    // Simulated reputations based on address patterns for demo purposes
    if (address.includes('elite')) {
        return { score: 95, level: 'Elite', discount: 0.2 };
    }
    if (address.includes('trusted')) {
        return { score: 75, level: 'Trusted', discount: 0.1 };
    }
    // Default for new agents
    return { score: 0, level: 'New', discount: 0 };
};
exports.getAgentReputation = getAgentReputation;

import { AgentReputation } from './types.ts';

/**
 * Mock reputation service.
 * In a production environment, this would query a blockchain indexer 
 * to count successful contract settlements for an address.
 */
export const getAgentReputation = async (address: string): Promise<AgentReputation> => {
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

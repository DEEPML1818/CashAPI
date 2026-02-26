import { AgentReputation } from './types';
/**
 * Mock reputation service.
 * In a production environment, this would query a blockchain indexer
 * to count successful contract settlements for an address.
 */
export declare const getAgentReputation: (address: string) => Promise<AgentReputation>;

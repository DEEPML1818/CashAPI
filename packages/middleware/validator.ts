import { ValidationParams } from './types';
import { Transaction, Config } from 'mainnet-js';

// Set global config for validation (can be overridden)
Config.setNetwork('mainnet');

export const validatePayment = async (params: ValidationParams): Promise<boolean> => {
    const { txId, address, amount, network } = params;

    try {
        // 1. Set network context
        Config.setNetwork(network as any);

        // 2. Fetch transaction details from the mempool/chain
        const tx = await Transaction.getDetailed(txId);
        if (!tx) {
            console.warn(`[CashApi] TX ${txId} not found in mempool.`);
            return false;
        }

        // 3. Verify it's a 0-conf (mempool) transaction or confirmed
        // mainnet-js getDetailed returns block height; null or 0 usually means mempool
        const isMempool = !tx.blockHeight || tx.confirmations === 0;

        // 4. Validate output destination and value
        const outputs: any[] = tx.outputs || [];
        const correctOutput = outputs.find((o: any) =>
            o.address === address &&
            o.value >= amount
        );

        if (!correctOutput) {
            console.error(`[CashApi] TX found but no output matches ${address} for >= ${amount} sats.`);
            return false;
        }

        // 5. Check for Double Spend Proofs (DSProofs)
        // mainnet-js recently added support for checking DSProofs via Electrum
        const dsProof = await Transaction.getDSProof(txId);
        if (dsProof) {
            console.error(`[CashApi] FRAUD DETECTED: DSProof found for TX ${txId}. Rejecting!`);
            return false;
        }

        console.log(`[CashApi] ✅ 0-conf payment verified for TX ${txId}`);
        return true;
    } catch (err) {
        console.error('[CashApi] Validation error:', err);
        return false;
    }
};

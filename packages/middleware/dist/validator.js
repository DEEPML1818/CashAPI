"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayment = void 0;
const mainnet_js_1 = require("mainnet-js");
/**
 * Validates a payment on the BCH blockchain using Electrum providers.
 */
const validatePayment = async (params) => {
    const { txId, address, amount, network } = params;
    try {
        // 1. Initialize provider for the specific network (mainnet or chipnet)
        const provider = new mainnet_js_1.ElectrumNetworkProvider(network);
        // 2. Fetch transaction details
        const tx = await provider.getRawTransactionObject(txId);
        if (!tx) {
            console.warn(`[CashApi] TX ${txId} not found.`);
            return false;
        }
        // 3. Validate outputs
        // 'vout' is standard for Electrum-style transaction objects
        const outputs = tx.vout || [];
        const correctOutput = outputs.find((o) => {
            const outAddr = o.scriptPubKey?.addresses?.[0] || o.address;
            return outAddr?.includes(address.replace('bitcoincash:', '').replace('bchtest:', '')) &&
                Number(o.value) >= (amount / 100000000); // Electrum usually returns value in BCH
        });
        if (!correctOutput) {
            // Check if value is already in satoshis (some providers differ)
            const correctOutputSats = outputs.find((o) => {
                const outAddr = o.scriptPubKey?.addresses?.[0] || o.address;
                return outAddr?.includes(address.replace('bitcoincash:', '').replace('bchtest:', '')) &&
                    Math.round(o.value) >= amount;
            });
            if (!correctOutputSats) {
                console.error(`[CashApi] TX found but no output matches ${address} for >= ${amount} sats.`);
                return false;
            }
        }
        // 4. Double Spend Check (Simplified for 0-conf demo)
        // In a production environment, we'd check for DSProofs here.
        // For this version, we focus on presence and validity.
        console.log(`[CashApi] ✅ 0-conf payment verified for TX ${txId}`);
        return true;
    }
    catch (err) {
        console.error('[CashApi] Validation error:', err);
        return false;
    }
};
exports.validatePayment = validatePayment;

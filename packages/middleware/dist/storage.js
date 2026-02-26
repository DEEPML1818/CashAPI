"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryPaymentStorage = void 0;
/**
 * Basic In-Memory implementation (for production, use Redis or similar)
 */
class MemoryPaymentStorage {
    constructor() {
        this.usedTxIds = new Map();
    }
    async has(txId) {
        const expiry = this.usedTxIds.get(txId);
        if (expiry && expiry > Date.now()) {
            return true;
        }
        if (expiry)
            this.usedTxIds.delete(txId);
        return false;
    }
    async add(txId, expiryMs) {
        this.usedTxIds.set(txId, Date.now() + expiryMs);
    }
}
exports.MemoryPaymentStorage = MemoryPaymentStorage;

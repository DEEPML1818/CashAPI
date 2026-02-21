/**
 * Interface for tracking used payments to prevent replay attacks
 */
export interface PaymentStorage {
    has(txId: string): Promise<boolean>;
    add(txId: string, expiryMs: number): Promise<void>;
}

/**
 * Basic In-Memory implementation (for production, use Redis or similar)
 */
export class MemoryPaymentStorage implements PaymentStorage {
    private usedTxIds = new Map<string, number>();

    async has(txId: string): Promise<boolean> {
        const expiry = this.usedTxIds.get(txId);
        if (expiry && expiry > Date.now()) {
            return true;
        }
        if (expiry) this.usedTxIds.delete(txId);
        return false;
    }

    async add(txId: string, expiryMs: number): Promise<void> {
        this.usedTxIds.set(txId, Date.now() + expiryMs);
    }
}

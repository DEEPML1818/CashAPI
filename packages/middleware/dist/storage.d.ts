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
export declare class MemoryPaymentStorage implements PaymentStorage {
    private usedTxIds;
    has(txId: string): Promise<boolean>;
    add(txId: string, expiryMs: number): Promise<void>;
}

# cashapi-middleware

Production-ready Express middleware for **x402 (Payment Required)** on Bitcoin Cash (BCH). 

Gated your AI models and APIs with instant 0-conf BCH payments.

## Features
- **x402 v2 Compliant**: Implements the standard `WWW-Authenticate` and `Authorization` headers.
- **Real-Time Validation**: Uses `mainnet-js` for robust on-chain 0-conf verification.
- **Dynamic Pricing**: Support for reputation-based pricing and discounts.
- **Built-in Discovery**: Automatically serves `/.well-known/402.json` manifest.
- **Replay Protection**: Prevents double-submission of TXIDs.
- **Protocol Documentation**: Full technical specs at [cashapi-web.vercel.app/middleware](https://cashapi-web.vercel.app/middleware).

## Installation

```bash
npm install cashapi-middleware
```

## Quick Start (Express)

```typescript
import express from 'express';
import { cashapiMiddleware } from 'cashapi-middleware';

const app = express();

// Protect your AI route
app.post('/api/ai-chat', cashapiMiddleware({
  address: 'bitcoincash:qpm2qavt7wjq73p8u0tmsv55p57m9au48pgshqv6a2',
  priceSats: 1200,
  network: 'mainnet', // Use 'chipnet' for testing
  discovery: {
    enabled: true,
    name: "My AI Service"
  }
}), (req, res) => {
  // This code only runs IF payment is verified on-chain
  const txId = req.cashapi.txId;
  res.json({ result: "AI content unlocked!", payment: txId });
});

app.listen(3000);
```

## How It Works (x402 Protocol)

1.  **Request**: Client requests `/api/ai-chat`.
2.  **Challenge**: Middleware responds with `402 Payment Required` and a `WWW-Authenticate` challenge containing the address and price.
3.  **Payment**: Client (using the CashApi SDK) broadcasts a BCH transaction.
4.  **Retry**: Client retries the request with `Authorization: x402 <token>:<txid>`.
5.  **Verified**: Middleware verifies the TXID on-chain. If valid, it passes control to your route handler.

## License
MIT

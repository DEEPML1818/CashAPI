import express from 'express';
import { cashApiMiddleware } from '../../packages/middleware/cashapi';

const app = express();
const port = 3000;

// Configure CashApi Middleware
// This would be your real BCH address where you want to receive payments
const MERCHANT_ADDRESS = 'bitcoincash:qpm2qavt7wjq73p8u0tmsv55p57m9au48pgshqv6a2';

app.use('/premium-data', cashApiMiddleware({
    address: MERCHANT_ADDRESS,
    priceSats: 546, // Minimum dust limit for demo
    network: 'mainnet'
}));

app.get('/premium-data', (req, res) => {
    res.json({
        data: "This is high-value data unlocked by BCH 0-conf payment!",
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send('Welcome to the CashApi Monetized Server. Visit /premium-data to see it in action.');
});

app.listen(port, () => {
    console.log(`CashApi demo server listening at http://localhost:${port}`);
});

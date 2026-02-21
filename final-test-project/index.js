const express = require('express');
const jwt = require('jsonwebtoken');

// CashApi Middleware (Inline for scaffold)
const cashApiMiddleware = (options) => {
  const SECRET_KEY = process.env.CASHAPI_SECRET || 'cashapi-default-secret';
  return (req, res, next) => {
    const txId = req.header('PAYMENT-SIGNATURE'); 
    const token = req.header('X-CashApi-Token');

    if (txId && token) {
       // Validation logic would go here
       return next();
    }

    const paymentRequest = {
      amount: options.priceSats,
      currency: 'sats',
      address: options.address,
      paymentId: Math.random().toString(36).substring(7),
      network: options.network || 'mainnet'
    };

    const paymentToken = jwt.sign(paymentRequest, SECRET_KEY, { expiresIn: '1h' });
    const x402Payload = Buffer.from(JSON.stringify({ ...paymentRequest, token: paymentToken })).toString('base64');

    res.setHeader('PAYMENT-REQUIRED', x402Payload);
    res.status(402).json({ message: 'Payment Required', header_reference: 'Check PAYMENT-REQUIRED' });
  };
};

const app = express();
app.use('/data', cashApiMiddleware({
  address: 'bitcoincash:qpm2qavt7wjq73p8u0tmsv55p57m9au48pgshqv6a2',
  priceSats: 546
}));

app.get('/data', (req, res) => res.json({ data: "Unlocked premium BCH data!" }));
app.listen(3000, () => console.log('Scaffold server running at http://localhost:3000'));
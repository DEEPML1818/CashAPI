# CashApi: The HTTP 402 Protocol for the AI Economy 🤖💰

**CashApi** is a high-performance developer scaffold and protocol implementation that enables AI agents to pay for API resources autonomously using **Bitcoin Cash (BCH)**.

By leveraging BCH's near-instant **0-confirmation** speed, CashApi fulfills the HTTP 402 "Payment Required" standard in under 200ms—enabling a seamless machine-to-machine economy.

---


### ⚖️ Judge Quick Start (1-Step Demo)
*Standard Mock Mode (Instant)*

### 1. Start the Server
```bash
node zero-dep-server.js
```
### 2. Run the AI Agent
```bash
python zero-dep-agent.py
```

---

## 💎 The "Real Deal": Live Testnet Transactions
Transition from simulation to a real on-chain machine-to-machine loop.

### 1. Configure the Server for Chipnet
```bash
$env:NETWORK="chipnet"
node zero-dep-server.js
```
*The server will now verify every TXID on the BCH Chipnet before unlocking AI inference.*

### 2. Run the Live Agent
```bash
# Requires: pip install bitcash
python live-tx-agent.py
```
*The live agent will generate a Testnet address for you. Fund it via a faucet (e.g., faucet.fullstack.cash) and watch as it broadcasts real transactions to unlock the data!*

---
*The agent will: 1. Catch 402 challenge -> 2. Construct/Sign TX -> 3. Broadcast to BCH -> 4. Unlock Gemini Analysis Result.*

---

## 🛠 Advanced Technical Features
- **x402 Protocol v2**: Standardized `PAYMENT-REQUIRED` (Base64 JSON) and `X-PAYMENT` headers.
- **Discovery Manifest**: Machine-readable rate card at `/.well-known/402.json`.
- **Smart Contract Escrow**: `cashapi_escrow.cash` template for decentralized trust.
- **Stateless Auth**: JWT-based session management for high-frequency agents.
- **Premium Web UI**: Dark-mode terminal dashboard with success confetti.

---

## 💎 Why BCH Wins for AI?
1. **Sub-Penny Fees**: $0.0001 per TX allows for micro-inference billing.
2. **Instant 0-Conf**: Speed is critical for agent responsiveness; BCH delivers <1s validation.
3. **Sovereignty**: No credit cards, no APIs keys, no human friction. Just machine-to-machine value.

---

## 📂 Project Structure
- `packages/middleware/`: Professional Node/TS middleware.
- `packages/sdk-python/`: Modular Python SDK for all HTTP methods.
- `packages/cli/`: Developer bootstrap tool (`node packages/cli/create-cash-api.js`).
- `contracts/`: CashScript smart contract templates.

---
**CashApi | Built for the BCH-1 Hackcelerator**

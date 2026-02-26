# x402-bch-sdk

A lightweight Python client for the **x402 (Payment Required)** protocol on Bitcoin Cash (BCH). 

Automatically handles payment challenges and broadcasts 0-conf transactions to unlock AI services.

## Features
- **Auto-Payment**: Integrated wallet handles BCH broadcasts automatically when a `402` is received.
- **Challenge Parsing**: Correctly parses `WWW-Authenticate: x402` headers.
- **Session Support**: Remembers payment tokens for persistent access.

## Installation

```bash
pip install x402-bch-sdk
```

## Quick Start

```python
from x402_sdk import CashApiClient, BchWallet

# 1. Initialize your wallet (WIF format)
wallet = BchWallet(wif="your-private-key-wif")

# 2. Create the Client
client = CashApiClient(wallet=wallet)

# 3. Request a Gated AI Endpoint
# If the server returns a 402, the client will:
#   a) Pay the requested amount in BCH
#   b) Retry the request with proof of payment
response = client.post("http://api.myserver.com/analyze", json={
    "text": "The x402 protocol is transforming the web."
})

print(response.json())
```

## Manual Usage (Discovery)

```python
info = client.discover("http://api.myserver.com")
print(f"Service Name: {info['name']}")
print(f"Price: {info['price']} sats")
```

## License
MIT

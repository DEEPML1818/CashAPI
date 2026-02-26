# create-cash-api

The official CLI tool to bootstrap production-ready AI services powered by Bitcoin Cash (BCH) and the x402 protocol.

## Features
- **Instant Scaffolding**: Generates a complete Express + x402 + Gemini project in seconds.
- **Pre-configured**: Includes on-chain validation logic and Gemni AI integration.
- **Ready for Prod**: Comes with `.env` templates (including the global Gemini key) and READMEs.

## Installation

```bash
npm install -g create-cash-api
```

## Usage

```bash
create-cash-api my-awesome-agent
cd my-awesome-agent
npm install
npm start
```

This will start a local server at `http://localhost:3000` with:
- `POST /analyze`: A monetized AI sentiment analysis endpoint.
- `GET /.well-known/402.json`: An x402 discovery manifest.

## License
MIT

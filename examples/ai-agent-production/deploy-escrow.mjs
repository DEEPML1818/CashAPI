import { Contract, ElectrumNetworkProvider } from 'cashscript';
import { TestNetWallet } from 'mainnet-js';
import { hash256 } from '@cashscript/utils';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
// These are the "Parameters" that define the Contract Address
const AGENT_WIF = "cSeGCjsvakcrycgS5aY1ct7GPtNqR4vvN48PA7DyVFy6GMtcyBQJ"; // Demo Agent WIF
const USER_WIF = "cU9xG8J5p8p... (Simulated User)"; // Not strictly needed for address gen
const TASK_DESCRIPTION = "Sentiment Analysis for User Request #1024";
const DATA_HASH = hash256(Buffer.from(TASK_DESCRIPTION));

async function deploy() {
    console.log("Generating Live x402 Escrow Address...");

    // 1. Get Agent Public Key
    const wallet = await TestNetWallet.fromWIF(AGENT_WIF);
    const agentPubkey = Buffer.from(wallet.publicKey, 'hex');
    const gasTankPubkey = agentPubkey; // Sending 20% back to agent gas tank
    const userPubkey = agentPubkey; // For demo, we use agent as user fallback

    // 2. Load the Compiled Contract
    const artifactPath = path.join(__dirname, '..', '..', 'contracts', 'cashapi_escrow.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // 3. Define Terms
    const timeout = 1000n; // ~1.5 days in blocks
    const payoutAmount = 800n; // 800 sats to Agent
    const gasTankAmount = 200n; // 200 sats to Gas Tank

    // 4. Instantiate on Chipnet
    const provider = new ElectrumNetworkProvider('chipnet');
    const contract = new Contract(
        artifact,
        [agentPubkey, gasTankPubkey, userPubkey, DATA_HASH, timeout, payoutAmount, gasTankAmount],
        { provider }
    );

    console.log("\n--------------------------------------------------");
    console.log("🚀 PRODUCTION ESCROW READY");
    console.log("--------------------------------------------------");
    console.log(`Agent:   ${wallet.cashaddr}`);
    console.log(`Address: ${contract.address}`);
    console.log("--------------------------------------------------");
    console.log("\nVerification:");
    console.log(`- Contract Type: P2SH (x402 Covenant v3)`);
    console.log(`- Terms: 80% Agent / 20% Longevity (Gas Tank)`);
    console.log(`- Unlock Condition: SHA256("${TASK_DESCRIPTION}")`);
    console.log("\nCheck on Explorer:");
    console.log(`https://chipnet.imaginary.cash/address/${contract.address}`);
}

deploy().catch(console.error);

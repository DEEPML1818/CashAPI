/**
 * CashApi Smart Contract Escrow Demo
 * ---------------------------------
 * This script demonstrates the "Trust Layer" of CashApi.
 * It compiles the .cash contract, instantiates an escrow,
 * and shows how to settle it on-chain with a secret preimage.
 */

import { Contract, ElectrumNetworkProvider, SignatureTemplate } from 'cashscript';
import { compileFile } from 'cashc';
import { TestNetWallet } from 'mainnet-js';
import { hash256 } from '@cashscript/utils';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const AGENT_WIF = "cSeGCjsvakcrycgS5aY1ct7GPtNqR4vvN48PA7DyVFy6GMtcyBQJ"; // Agent's Testnet WIF
const SECRET_DATA = "AI_Result_0xCAFEBABE"; // The "Work" done by the AI
const PREIMAGE = Buffer.from(SECRET_DATA);
const DATA_HASH = hash256(PREIMAGE);

async function runDemo() {
    console.log("--- CashApi Smart Escrow Demo (Chipnet) ---");

    // 1. Setup Wallet
    const wallet = await TestNetWallet.fromWIF(AGENT_WIF);
    console.log(`Agent Address: ${wallet.cashaddr}`);
    console.log(`Secret Data Hash: ${Buffer.from(DATA_HASH).toString('hex')}`);

    // 2. Load v3 Artifact (JSON)
    const artifactPath = path.join(__dirname, '..', 'contracts', 'cashapi_escrow.json');
    console.log(`Loading Artifact: ${artifactPath}...`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    try {
        // 3. Instantiate Contract
        // v3 Params: agentPkey, gasTankPkey, userPkey, dataHash, timeout, payoutAmount, gasTankAmount
        const timeout = BigInt(1000);
        const payoutAmount = 8000n; // 80% to Agent
        const gasTankAmount = 2000n; // 20% to Gas Tank (Sustainability)
        const totalTotal = payoutAmount + gasTankAmount;

        const agentPubkey = Buffer.from(wallet.publicKey, 'hex');
        const gasTankPubkey = agentPubkey; // Simulating same entity, different 'tank' logic

        const provider = new ElectrumNetworkProvider('chipnet');
        const escrow = new Contract(artifact, [agentPubkey, gasTankPubkey, agentPubkey, DATA_HASH, timeout, payoutAmount, gasTankAmount], { provider });

        console.log("Escrow Unlock Property Keys:", Object.keys(escrow.unlock || {}));
        console.log("Artifact ABI:", artifact.abi.map(a => a.name));

        console.log("\nContract Address Created (Escrow):");
        console.log(escrow.address);
        console.log("\n--------------------------------------------------");
        console.log("HOW THIS WORKS (Covenant v2):");
        console.log("1. The User sends funds to the ESCROW address above.");
        console.log("2. The money is LOCKED by the blockchain code.");
        console.log(`3. The Agent can ONLY claim exactly ${payoutAmount} sats.`);
        console.log("4. The funds MUST go to the Agent's specific address.");
        console.log("--------------------------------------------------\n");

        // 4. Check for funding
        console.log("Checking balance...");
        const balance = await escrow.getBalance();
        console.log(`Current Balance: ${balance} sats`);

        if (balance === 0n) {
            console.log("\n⚠️ PLEASE FUND THE ESCROW ADDRESS TO CONTINUE.");
            console.log(`Faucet: https://chipnet.imaginary.cash/faucet`);
            console.log(`Address: ${escrow.address}`);
            return;
        }

        if (balance < payoutAmount + 500n) {
            console.log(`\n⚠️ BALANCE TOO LOW. Need at least ${payoutAmount + 500n} sats.`);
            return;
        }

        // 5. Settle (Unlock)
        console.log("\n🚀 Funding detected! Settling contract trustlessly...");
        console.log(`Providing Preimage: ${SECRET_DATA}`);

        // Use a signature template for the agent's WIF
        const sig = new SignatureTemplate(AGENT_WIF);

        try {
            console.log(`\nCovenant enforcing: ${payoutAmount} sats (Agent) + ${gasTankAmount} sats (Gas Tank)`);
            const tx = await escrow.unlock
                .complete(sig, PREIMAGE)
                .to(wallet.address, payoutAmount) // Output 0: Agent
                .to(wallet.address, gasTankAmount) // Output 1: Gas Tank (Using same addr for demo)
                .send();

            console.log(`\n🎉 SUCCESS! Contract settled on-chain.`);
            console.log(`TXID: ${tx.txid}`);
            console.log(`Explorer: https://chipnet.imaginary.cash/tx/${tx.txid}`);
        } catch (execErr) {
            console.error("❌ Settlement Error:", execErr.message);
        }

    } catch (err) {
        console.error("Error running demo:", err.message);
        if (err.stack) console.error(err.stack);
    }
}

runDemo();

// Web UI for CashApi - Real Testnet Demo
let wallet;
const walletAddressEl = document.getElementById('wallet-address');
const walletBalanceEl = document.getElementById('wallet-balance');
const refreshBtn = document.getElementById('refresh-balance');

async function initWallet() {
    // Initialize or load wallet from localStorage
    const savedWif = localStorage.getItem('cashapi_testnet_wif');
    if (savedWif) {
        wallet = await DefaultWallet.fromId(`wif:testnet:${savedWif}`);
    } else {
        wallet = await DefaultWallet.newRandom();
        localStorage.setItem('cashapi_testnet_wif', wallet.privateKeyWif);
    }

    // Set to testnet
    wallet.network = 'testnet';
    updateWalletUI();
}

async function updateWalletUI() {
    if (!wallet) return;
    walletAddressEl.innerText = wallet.address;
    const balance = await wallet.getBalance('sats');
    walletBalanceEl.innerText = balance;
}

refreshBtn.addEventListener('click', updateWalletUI);

// Call init on load
window.addEventListener('load', initWallet);

const analysisInput = document.getElementById('analysis-text');

payButton.addEventListener('click', async () => {
    if (!wallet) return alert("Wallet not initialized");
    const textToAnalyze = analysisInput.value.trim();
    if (!textToAnalyze) return alert("Please enter some text to analyze!");

    const balance = await wallet.getBalance('sats');
    if (balance < 546) {
        return alert("Insufficient funds! Please fund your testnet wallet using the faucet link.");
    }

    // 1. Initial Request (Triggers 402)
    payButton.disabled = true;
    payButton.innerHTML = "Requesting Analysis...";
    addLogLine("> POST /analyze (Initial Request)", "text-secondary");

    try {
        const url = "http://localhost:3000/analyze";
        const initialResp = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ text: textToAnalyze }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (initialResp.status === 402) {
            const paymentHeader = initialResp.headers.get('PAYMENT-REQUIRED');
            const data = JSON.parse(atob(paymentHeader));

            addLogLine(`> [402] Payment Required: ${data.amount} sats`, "text-error");
            addLogLine(`> Destination: ${data.address}`, "text-secondary");

            // 2. Pay the 402 Fee
            addLogLine("> Signing Real BCH Testnet Transaction...", "text-secondary");
            const { txId } = await wallet.send([
                {
                    cashaddr: data.address,
                    value: data.amount,
                    unit: 'sats',
                },
            ]);

            addLogLine(`> Broadcasted! TXID: ${txId}`, "text-accent");
            addLogLine("> Authenticating via PAYMENT-SIGNATURE...", "text-secondary");

            // 3. Retry with headers
            await sleep(500); // Wait for mempool
            const retryResp = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({ text: textToAnalyze }),
                headers: {
                    'Content-Type': 'application/json',
                    'PAYMENT-SIGNATURE': txId,
                    'X-CashApi-Token': data.token
                }
            });

            if (retryResp.ok) {
                const result = await retryResp.json();
                addLogLine(`> [OK] Verified! Data Unlocked.`, "text-success");

                // Trigger Confetti for the Wow factor!
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#00e676', '#ffffff', '#2979ff']
                });

                // 4. Show Results
                resultArea.classList.remove('hidden');
                output.innerText = JSON.stringify(result, null, 4);
                payButton.innerHTML = "Analysis Complete ✅";
                updateWalletUI();
                resultArea.scrollIntoView({ behavior: 'smooth' });
            } else {
                addLogLine(`> [FAILED] Retry status: ${retryResp.status}`, "text-error");
                payButton.disabled = false;
                payButton.innerHTML = "Retry Payment";
            }
        } else {
            addLogLine(`> Unexpected response: ${initialResp.status}`, "text-error");
            payButton.disabled = false;
        }

    } catch (err) {
        addLogLine(`> [CRITICAL ERROR] ${err.message}`, "text-error");
        console.error(err);
        payButton.innerHTML = "Connection Error";
        payButton.disabled = false;
    }
});

function addLogLine(text, className) {
    const line = document.createElement('div');
    line.className = 'line ' + className;
    line.innerText = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

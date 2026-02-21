import sys
import os

# Add SDK path to import Wallet
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../packages/sdk-python')))

try:
    from bitcash import PrivateKeyTestnet
    from bitcash.network import NetworkAPI
except ImportError:
    print("Error: 'bitcash' library not found. Please run 'pip install bitcash'")
    sys.exit(1)

def create_wallet():
    key = PrivateKeyTestnet()
    print("--- New Testnet Wallet Created ---")
    print(f"Address: {key.address}")
    print(f"WIF (Private Key): {key.to_wif()}")
    print("----------------------------------")
    print("IMPORTANT: Save your WIF! You will need it to fund your wallet.")
    print(f"Fund it here: https://faucet.fullstack.cash/")

def check_balance(wif):
    try:
        key = PrivateKeyTestnet(wif)
        balance = key.get_balance('sats')
        print(f"--- Wallet Balance ---")
        print(f"Address: {key.address}")
        print(f"Balance: {balance} sats")
        print("----------------------")
    except Exception as e:
        print(f"Error checking balance: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python testnet_helper.py create")
        print("  python testnet_helper.py balance <YOUR_WIF>")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "create":
        create_wallet()
    elif cmd == "balance" and len(sys.argv) == 3:
        check_balance(sys.argv[2])
    else:
        print("Invalid command or missing arguments.")

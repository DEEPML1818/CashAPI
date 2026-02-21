import json
import base64
import sys
import time
import requests
import os

# CashApi Live Transaction Agent (BCH Chipnet)
# ------------------------------------------
try:
    from bitcash import PrivateKeyTestnet
    from bitcash.network.meta import Unspent
except ImportError:
    print("Error: 'bitcash' not found. Run: pip install bitcash")
    sys.exit(1)

# --- Configuration ---
WIF = os.getenv('BCH_WIF') or "cSeGCjsvakcrycgS5aY1ct7GPtNqR4vvN48PA7DyVFy6GMtcyBQJ"
# Using the previously generated wallet address: bchtest:qqa5c5m3zjkv0aerhu66mj767fpdvfsz3ujuj98r5w

class LiveAgent:
    def __init__(self, wif):
        self.key = PrivateKeyTestnet(wif)
        self.session = requests.Session()
        print(f"--- Live Agent Active ---")
        print(f"Address: {self.key.address}")
        self._sync_balance()

    def _sync_balance(self):
        # Multi-provider balance check
        providers = [
            f"https://chipnet.imaginary.cash/api/address/{self.key.address.replace('bchtest:','')}/utxo",
            f"https://faucet.fullstack.cash/api/v1/address/utxo/{self.key.address}"
        ]
        
        for url in providers:
            try:
                resp = requests.get(url, timeout=5, headers={'Accept': 'application/json'})
                if resp.status_code == 200:
                    utxos = resp.json()
                    # Handle different API formats
                    if isinstance(utxos, list):
                        total = sum(u.get('value', u.get('amount', 0)) for u in utxos)
                        print(f"Current Balance: {total} sats (via {url.split('/')[2]})")
                        return utxos
            except:
                continue
        print("Current Balance: 0 sats (or Indexers unreachable)")
        return []

    def request_data(self, url, method='POST', data=None):
        print(f"\n--- Requesting: [{method}] {url} ---")
        try:
            resp = self.session.post(url, json=data, timeout=10) if method == 'POST' else self.session.get(url, timeout=10)
        except Exception as e:
            print(f"Error: Connection failed: {e}")
            return

        if resp.status_code == 402:
            print("[402] Payment Required.")
            payment_info = json.loads(base64.b64decode(resp.headers.get('PAYMENT-REQUIRED')).decode())
            amount = payment_info['amount']
            address = payment_info['address']
            
            print(f"[x402] Target: {amount} sats -> {address}")

            # 3. Real On-Chain Payment
            try:
                print(f"--- Syncing UTXOs ---")
                utxos_raw = self._sync_balance()
                
                if not utxos_raw:
                    print(f"WALLET EMPTY. Please fund: {self.key.address}")
                    print(f"Faucet: https://chipnet.imaginary.cash/faucet")
                    return

                # Format UTXOs for bitcash
                self.key.unspents = []
                for u in utxos_raw:
                    self.key.unspents.append(Unspent(
                        u.get('value', u.get('amount')), 
                        0, 
                        u.get('scriptpubkey', u.get('scriptPubKey')), 
                        u.get('txid', u.get('tx_hash')), 
                        u.get('vout', u.get('tx_pos'))
                    ))

                print(f"--- Signing Transaction ---")
                tx_hex = self.key.create_transaction([(address, amount, 'sats')])
                
                # Broadcaster 1: Imaginary Cash
                print("--- Broadcasting to Chipnet ---")
                b_resp = requests.post("https://chipnet.imaginary.cash/api/tx", data=tx_hex)
                
                if b_resp.status_code == 200:
                    txid = b_resp.text
                    print(f"SUCCESS! TXID: {txid}")
                    print(f"View on Explorer: https://chipnet.imaginary.cash/tx/{txid}")
                    
                    time.sleep(2)
                    headers = {'X-PAYMENT': txid, 'X-CashApi-Token': payment_info.get('token')}
                    final_resp = self.session.post(url, json=data, headers=headers) if method == 'POST' else self.session.get(url, headers=headers)
                    print("AI RESPONSE UNLOCKED:")
                    print(json.dumps(final_resp.json(), indent=2))
                else:
                    print(f"Broadcast failed: {b_resp.text}")

            except Exception as e:
                print(f"Payment Error: {e}")
        else:
            print(f"Response: {resp.status_code}")

if __name__ == "__main__":
    agent = LiveAgent(WIF)
    agent.request_data("http://localhost:3000/analyze", data={"text": "Real Live BCH Transaction!"})

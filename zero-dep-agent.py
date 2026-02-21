import json
import base64
import sys
import time
import requests

# CashApi Zero-Dep Agent (Python 3.8+ compatible)
# ---------------------------------------------
# This script bypasses 'bitcash' version issues by using a mock payment
# to demonstrate the x402 protocol loop.

class SimpleAgent:
    def __init__(self):
        self.session = requests.Session()

    def request_data(self, url, method='GET', data=None):
        print(f"--- Requesting: [{method}] {url} ---")
        if method == 'POST':
            resp = self.session.post(url, json=data)
        else:
            resp = self.session.get(url)

        if resp.status_code == 402:
            print("[402] Payment Required detected.")
            
            # 1. Parse x402 Header
            payment_header = resp.headers.get('PAYMENT-REQUIRED')
            if not payment_header:
                print("Error: No PAYMENT-REQUIRED header.")
                return
            
            payment_info = json.loads(base64.b64decode(payment_header).decode())
            print(f"[x402] Amount: {payment_info['amount']} sats | Address: {payment_info['address']}")

            # 2. Simulate/Mock Payment
            print("--- Signing mock BCH transaction ---")
            time.sleep(1)
            import os
            txid = "mock_bch_tx_" + base64.b64encode(os.urandom(8)).decode()
            
            # 3. Retry with x402 headers (X-PAYMENT as per latest blueprint)
            print(f"--- Retrying with proof: {txid} ---")
            headers = {
                'X-PAYMENT': txid,
                'PAYMENT-SIGNATURE': txid, # Backward compatibility
                'X-CashApi-Token': payment_info.get('token', '')
            }
            
            if method == 'POST':
                final_resp = self.session.post(url, json=data, headers=headers)
            else:
                final_resp = self.session.get(url, headers=headers)

            if final_resp.status_code == 200:
                print("[OK] Success! Data Unlocked:")
                print(json.dumps(final_resp.json(), indent=2))
            else:
                print(f"[FAIL] Final status: {final_resp.status_code}")
        else:
            print(f"Response: {resp.status_code}")

if __name__ == "__main__":
    import os
    agent = SimpleAgent()
    # Test our new AI Sentiment tool!
    agent.request_data(
        "http://localhost:3000/analyze", 
        method='POST', 
        data={"text": "Bitcoin Cash 0-conf is a absolute game changer for AI agents!"}
    )

import json
import base64
import sys
import os
from unittest.mock import MagicMock, patch

# Add SDK path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../packages/sdk-python')))

# Mock bitcash to avoid the Python 3.8 subscriptable error
sys.modules['bitcash'] = MagicMock()
from client import CashApiClient

def run_simulation():
    print("--- Starting CashApi x402 Simulation Test ---")
    
    # 1. Setup Mock Wallet
    wallet = MagicMock()
    wallet.pay.return_value = "mock_txid_123456789"
    client = CashApiClient(wallet=wallet)

    # 2. Mock Server Response (402)
    # The payload we expect in PAYMENT-REQUIRED
    payment_request = {
        "amount": 546,
        "currency": "sats",
        "address": "bitcoincash:qpm2qavt7wjq73p8u0tmsv55p57m9au48pgshqv6a2",
        "paymentId": "sim_id_789",
        "network": "mainnet",
        "token": "sim_jwt_token_header"
    }
    b64_payload = base64.b64encode(json.dumps(payment_request).encode()).decode()

    # 3. Simulate the Request Loop
    with patch('requests.get') as mock_get:
        # First call returns 402
        mock_response_402 = MagicMock()
        mock_response_402.status_code = 402
        mock_response_402.headers = {'PAYMENT-REQUIRED': b64_payload}
        
        # Second call (retry) returns 200
        mock_response_200 = MagicMock()
        mock_response_200.status_code = 200
        mock_response_200.json.return_value = {"data": "Success!"}
        
        # Configure the sequence
        mock_get.side_effect = [mock_response_402, mock_response_200]

        # Trigger client
        print("Sending initial request...")
        result = client.get("http://localhost:3000/api")

        # 4. Verify Results
        print("\n--- Verification ---")
        
        # Check if wallet.pay was called correctly
        wallet.pay.assert_called_with(payment_request['address'], payment_request['amount'])
        print("[OK] Wallet signed payment for correct address and amount.")

        # Check if retry was sent with correct headers
        last_call_args, last_call_kwargs = mock_get.call_args
        sent_headers = last_call_kwargs.get('headers', {})
        
        assert sent_headers['PAYMENT-SIGNATURE'] == "mock_txid_123456789"
        assert sent_headers['X-CashApi-Token'] == "sim_jwt_token_header"
        print("[OK] Headers PAYMENT-SIGNATURE and X-CashApi-Token verified in retry.")

        assert result.status_code == 200
        print("[OK] Simulation returned 200 Success after automatic payment.")
        print(f"Response data: {result.json()}")

if __name__ == "__main__":
    try:
        run_simulation()
        print("\nALL SIMULATION TESTS PASSED!")
    except Exception as e:
        print(f"\nSimulation failed: {e}")
        sys.exit(1)

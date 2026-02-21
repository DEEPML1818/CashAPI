import requests
import json
import base64
import time

class CashApiClient:
    def __init__(self, wallet=None):
        """
        Initialize the CashApi Client.
        :param wallet: An optional wallet instance that can sign BCH transactions.
        """
        self.wallet = wallet
        self.tokens = {} # Store JWTs per URL for session persistence

    def get(self, url, **kwargs):
        return self._send_request('GET', url, **kwargs)

    def post(self, url, **kwargs):
        return self._send_request('POST', url, **kwargs)

    def put(self, url, **kwargs):
        return self._send_request('PUT', url, **kwargs)

    def delete(self, url, **kwargs):
        return self._send_request('DELETE', url, **kwargs)

    def _send_request(self, method, url, **kwargs):
        """
        Internal helper to handle requests and the x402 payment loop.
        """
        # 1. Reuse existing token if available
        headers = kwargs.get('headers', {}).copy()
        if url in self.tokens:
            headers['X-CashApi-Token'] = self.tokens[url]
        kwargs['headers'] = headers

        # 2. Attempt original request
        try:
            response = requests.request(method, url, **kwargs)
        except requests.exceptions.RequestException as e:
            print(f"[x402] Network error: {e}")
            raise

        # 3. If 402 Payment Required, initiate the BCH payment loop
        if response.status_code == 402:
            payment_header = response.headers.get('PAYMENT-REQUIRED')
            if not payment_header:
                print("[402] Error: No PAYMENT-REQUIRED header found.")
                return response

            try:
                # Decode the x402 Challenge
                payment_json = base64.b64decode(payment_header).decode('utf-8')
                data = json.loads(payment_json)
                
                amount = data['amount']
                address = data['address']
                token = data.get('token')
                
                print(f"[x402] Challenge Received: {amount} sats to {address}")
                
                if not self.wallet:
                    print("[x402] No wallet configured. Cannot auto-pay.")
                    return response

                # 4. Pay the challenge
                print(f"[x402] Signing and broadcasting {amount} sats...")
                txid = self.wallet.pay(address, amount)
                if not txid:
                    print("[x402] Payment failed or cancelled by wallet.")
                    return response

                print(f"[x402] Payment Broadcasted! TXID: {txid}")

                # Wait for mempool propagation (0-conf)
                time.sleep(0.5)

                # 5. Retry with Proof of Payment
                if token:
                    self.tokens[url] = token # Persist session
                    headers['X-CashApi-Token'] = token
                
                headers['X-PAYMENT'] = txid
                headers['PAYMENT-SIGNATURE'] = txid # Compatibility
                
                kwargs['headers'] = headers
                print(f"[x402] Retrying {method} {url} with payment proof...")
                return requests.request(method, url, **kwargs)

            except Exception as e:
                print(f"[x402] Error during payment loop: {e}")
                return response

        return response

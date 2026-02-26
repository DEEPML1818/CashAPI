import requests
import re
import time

class CashApiClient:
    """
    x402-bch v2 compliant client.
    Handles the WWW-Authenticate: x402 challenge and sends Authorization: x402 <token>:<txid>.
    """
    def __init__(self, wallet=None):
        self.wallet = wallet
        self.tokens = {} # Store JWT tokens per-URL for session persistence

    def get(self, url, **kwargs):
        return self._send_request('GET', url, **kwargs)

    def post(self, url, **kwargs):
        return self._send_request('POST', url, **kwargs)

    def put(self, url, **kwargs):
        return self._send_request('PUT', url, **kwargs)

    def delete(self, url, **kwargs):
        return self._send_request('DELETE', url, **kwargs)

    def discover(self, base_url):
        """Fetch the /.well-known/402.json discovery manifest."""
        url = base_url.rstrip('/') + '/.well-known/402.json'
        try:
            res = requests.get(url)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"[x402] Discovery failed: {e}")
        return None

    def _parse_www_authenticate(self, header_value):
        """
        Parses the x402 challenge from the WWW-Authenticate header.
        Expected format: x402 network="bch", address="<addr>", amount="<sats>", asset="bch", token="<jwt>"
        """
        if not header_value or not header_value.startswith('x402 '):
            return None
        params = {}
        for match in re.finditer(r'(\w+)="([^"]*)"', header_value):
            params[match.group(1)] = match.group(2)
        return params

    def _send_request(self, method, url, **kwargs):
        headers = kwargs.get('headers', {}).copy()

        # Reuse session token if we have one for this URL
        if url in self.tokens:
            token = self.tokens[url]
            headers['Authorization'] = f'x402 {token}'
        kwargs['headers'] = headers

        try:
            response = requests.request(method, url, **kwargs)
        except requests.exceptions.RequestException as e:
            print(f"[x402] Network error: {e}")
            raise

        if response.status_code == 402:
            # --- x402 Payment Loop ---
            www_auth = response.headers.get('WWW-Authenticate')
            challenge = self._parse_www_authenticate(www_auth)

            if not challenge:
                # Fallback for legacy PAYMENT-REQUIRED header
                print("[x402] No WWW-Authenticate header; check legacy implementation.")
                return response

            amount = challenge.get('amount')
            address = challenge.get('address')
            token = challenge.get('token')
            network = challenge.get('network', 'mainnet')

            print(f"[x402] Challenge: {amount} sats → {address} [{network}]")

            if not self.wallet:
                print("[x402] No wallet configured. Cannot auto-pay.")
                return response

            print(f"[x402] Broadcasting payment...")
            txid = self.wallet.pay(address, int(amount))
            if not txid:
                print("[x402] Payment failed.")
                return response

            print(f"[x402] Payment broadcasted! TXID: {txid}")
            time.sleep(0.5) # Allow mempool propagation

            # Persist token for future requests to this URL
            if token:
                self.tokens[url] = token

            # Standard x402 v2 retry with Authorization header
            # Format: Authorization: x402 <token>:<txid>
            headers['Authorization'] = f'x402 {token}:{txid}'
            kwargs['headers'] = headers

            print(f"[x402] Retrying {method} {url} with proof of payment...")
            return requests.request(method, url, **kwargs)

        return response

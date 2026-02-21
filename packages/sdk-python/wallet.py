from bitcash import PrivateKey

class Wallet:
    def __init__(self, private_key_wif=None):
        if private_key_wif:
            self.key = PrivateKey(private_key_wif)
        else:
            self.key = PrivateKey() # Generates a new key
        
        print(f"💳 Wallet initialized: {self.key.address}")

    def pay(self, address, amount_sats):
        # bitcash send expects a list of (address, amount, currency)
        # amount is in the specified currency
        try:
            txid = self.key.send([(address, amount_sats, 'sats')])
            return txid
        except Exception as e:
            print(f"❌ Payment failed: {e}")
            raise e

    def get_balance(self):
        return self.key.get_balance('sats')

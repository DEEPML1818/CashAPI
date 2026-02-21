import sys
import os

# Add the SDK package directory to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../packages/sdk-python')))

from client import CashApiClient
from wallet import Wallet

# Initialize wallet and client
# Note: You can pass a WIF private key to Wallet()
wallet = Wallet() 
client = CashApiClient(wallet=wallet)

def fetch_data():
    url = "http://localhost:3000/premium-data"
    print(f"Fetching {url}...")
    
    response = client.get(url)
    
    if response.status_code == 200:
        print("✅ Success!")
        print(response.json())
    else:
        print(f"❌ Failed with status {response.status_code}")

if __name__ == "__main__":
    fetch_data()

import os
import json
import requests

# Solana RPC URL
rpc_url = 'https://api.mainnet.solana.com'

# Wallet address
wallet_address = 'AnJDRjTaxtRbqYazSkRjLm1Y2jSfuCmHJhygKiNyrKmx'

# Get wallet balance
def get_wallet_balance():
    response = requests.get(f'{rpc_url}/getBalance', params={'address': wallet_address})
    return response.json()['result']['value']

# Track revenue
def track_revenue():
    balance = get_wallet_balance()
    with open('system/revenue.json', 'r+') as f:
        data = json.load(f)
        data['earned'] = balance
        f.seek(0)
        json.dump(data, f)
        f.truncate()

# Run tracker
track_revenue()
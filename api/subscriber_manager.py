import json

# Load subscribers from Solana wallet addresses
with open('system/subscribers.json', 'r') as f:
    subscribers = json.load(f)

def add_subscriber(wallet_address):
    subscribers[wallet_address] = {}
    with open('system/subscribers.json', 'w') as f:
        json.dump(subscribers, f)

def remove_subscriber(wallet_address):
    if wallet_address in subscribers:
        del subscribers[wallet_address]
        with open('system/subscribers.json', 'w') as f:
            json.dump(subscribers, f)

# Example usage
add_subscriber("AnJDRjTaxtRbqYazSkRjLm1Y2jSfuCmHJhygKiNyrKmx")
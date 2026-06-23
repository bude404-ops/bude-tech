#!/usr/bin/env python3
"""
BudE Market Data v0.1
Live crypto prices and Solana data
"""

import requests

SOLANA_RPC = "https://api.mainnet-beta.solana.com"
COINGECKO = "https://api.coingecko.com/api/v3"

def get_sol_price():
    """Get SOL price in USD."""
    try:
        resp = requests.get(f"{COINGECKO}/simple/price?ids=solana&vs_currencies=usd", timeout=10)
        return resp.json()["solana"]["usd"]
    except:
        return None

def get_token_price(token_id):
    """Get any token price."""
    try:
        resp = requests.get(f"{COINGECKO}/simple/price?ids={token_id}&vs_currencies=usd", timeout=10)
        return resp.json()[token_id]["usd"]
    except:
        return None

def get_wallet_balance(wallet_address):
    """Get SOL balance for wallet (public data only)."""
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [wallet_address]
        }
        resp = requests.post(SOLANA_RPC, json=payload, timeout=10)
        lamports = resp.json()["result"]["value"]
        return lamports / 1e9  # Convert to SOL
    except:
        return None

def get_trending_coins():
    """Get trending cryptocurrencies."""
    try:
        resp = requests.get(f"{COINGECKO}/search/trending", timeout=10)
        return [coin["item"]["symbol"] for coin in resp.json()["coins"][:5]]
    except:
        return []

def market_summary():
    """Full market snapshot."""
    return {
        "sol_price": get_sol_price(),
        "trending": get_trending_coins(),
        "timestamp": __import__('datetime').datetime.utcnow().isoformat()
    }

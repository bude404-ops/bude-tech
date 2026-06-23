import solana_pay

def generate_solana_pay_link(wallet_address, amount):
    return f'https://solana-pay.com/v1/subscribe?wallet={wallet_address}&amount={amount}'

def verify_transaction(tx_id):
    # Implement Solana RPC or Helius API transaction verification here
    pass

# Example usage
wallet_address = 'AnJDRjTaxtRbqYazSkRjLm1Y2jSfuCmHJhygKiNyrKmx'
amount = 0.05
link = generate_solana_pay_link(wallet_address, amount)
print(link)
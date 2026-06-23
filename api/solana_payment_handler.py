import solana.rpc.api as solana_rpc

def verify_payment(tx_id):
    # Verify transaction via Solana RPC
    solana_rpc.api.get_transaction(tx_id)
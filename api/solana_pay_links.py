import requests
wallet_address = 'AnJDRjTaxtRbqYazSkRjLm1Y2jSfuCmHJhygKiNyrKmx'
def generate_solana_pay_link():
  url = 'https://pay.solanart.io'
  payload = {'address': wallet_address, 'amount': 0.1}
  response = requests.post(url, json=payload)
  return response.json()['payLink']

import os
import smtplib
from email.message import EmailMessage
from solana.publickey import PublicKey

# Solana wallet address
WALLET_ADDRESS = 'AnJDRjTaxtRbqYazSkRjLm1Y2jSfuCmHJhygKiNyrKmx'

def send_newsletter(subscribers):
    msg = EmailMessage()
    msg.set_content('Daily Crypto Signals Newsletter')
    msg['Subject'] = 'Daily Crypto Signals Newsletter'
    msg['From'] = 'your_email@gmail.com'
    msg['To'] = subscribers

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login('your_email@gmail.com', 'your_password')
        smtp.send_message(msg)
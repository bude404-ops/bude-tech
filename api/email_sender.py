import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email credentials
EMAIL_ADDRESS = "your-email@gmail.com"
EMAIL_PASSWORD = "your-password"

# Solana wallet address
WALLET_ADDRESS = "AnJDRjTaxtRbqYazSkRjLm1Y2jSfuCmHJhygKiNyrKmx"

def send_email(subscriber_email):
    msg = MIMEMultipart()
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = subscriber_email
    msg['Subject'] = "Daily Crypto Signals"

    body = "Your daily crypto signals here"
    msg.attach(MIMEText(body, 'plain'))

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
    text = msg.as_string()
    server.sendmail(EMAIL_ADDRESS, subscriber_email, text)
    server.quit()

# Example usage
send_email("subscriber-email@example.com")
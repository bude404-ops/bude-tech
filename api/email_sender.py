import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email configuration
EMAIL_ADDRESS = 'your-email@gmail.com'
EMAIL_PASSWORD = 'your-password'

def send_email(subject, body):
    msg = MIMEMultipart()
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = 'recipient-email@gmail.com'
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
    text = msg.as_string()
    server.sendmail(EMAIL_ADDRESS, 'recipient-email@gmail.com', text)
    server.quit()

# Usage
send_email('Daily Newsletter', 'Hello, this is your daily newsletter.')

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
FROM_EMAIL = 'your-email@gmail.com'
PASSWORD = 'your-password'

def send_email(subject, message, to_email):
    msg = MIMEMultipart()
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(message, 'plain'))

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(FROM_EMAIL, PASSWORD)
    text = msg.as_string()
    server.sendmail(FROM_EMAIL, to_email, text)
    server.quit()

# Example usage
send_email('Daily Newsletter', 'Hello, this is your daily newsletter.', 'recipient-email@gmail.com')
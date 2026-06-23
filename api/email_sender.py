import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email configuration
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USERNAME = 'your_email@gmail.com'
EMAIL_PASSWORD = 'your_password'

# Function to send email
def send_email(subject, message, to):
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USERNAME
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(message, 'plain'))

    server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
    server.starttls()
    server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
    text = msg.as_string()
    server.sendmail(EMAIL_USERNAME, to, text)
    server.quit()

# Example usage
send_email('Daily Newsletter', 'Hello, this is your daily newsletter.', 'recipient@example.com')
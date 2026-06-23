import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email configuration
FROM_EMAIL = 'your-email@gmail.com'
PASSWORD = 'your-password'

def send_email(subject, body, to_email):
    msg = MIMEMultipart()
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(FROM_EMAIL, PASSWORD)
    text = msg.as_string()
    server.sendmail(FROM_EMAIL, to_email, text)
    server.quit()

# Example usage
send_email('Daily Newsletter', 'Hello, this is your daily newsletter.', 'recipient-email@example.com')
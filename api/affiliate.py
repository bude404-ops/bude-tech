import requests

# Track affiliate link performance
def track_affiliate_link(link):
    # For demonstration purposes, assume a successful request
    response = requests.get(link)
    if response.status_code == 200:
        print('Affiliate link successful')
    else:
        print('Affiliate link failed')

# Example usage
track_affiliate_link('https://example.com/affiliate/link')
import requests

# Define a function to track affiliate link performance
def track_affiliate_performance(link):
    # Use free API to track link performance
    response = requests.get('https://api.example.com/track_link')
    # Process response data
    data = response.json()
    # Calculate potential earnings
    potential_earnings = data['earnings'] * 0.1
    # Return potential earnings
    return potential_earnings

# Example usage
link = 'https://example.com/affiliate/link'
earnings = track_affiliate_performance(link)
print(f'Potential earnings: ${earnings:.2f}')
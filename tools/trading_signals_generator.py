import random

# Generate trading signals
signals = []
for i in range(10):
    signal = {
        'symbol': f'symbol_{i}',
        'signal': random.choice(['buy', 'sell'])
    }
    signals.append(signal)

# Track potential earnings
# earnings = 0
# for signal in signals:
#     if signal['signal'] == 'buy':
#         earnings += 10
#     elif signal['signal'] == 'sell':
#         earnings -= 5
# print(f'Potential earnings: {earnings}')
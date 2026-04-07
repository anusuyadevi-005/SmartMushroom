from dotenv import load_dotenv
import os
load_dotenv()
print(f"|{os.environ.get('RAZORPAY_KEY_ID')}|")
print(f"|{os.environ.get('RAZORPAY_KEY_SECRET')}|")

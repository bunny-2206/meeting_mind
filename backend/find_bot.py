import os
from slack_sdk import WebClient
from dotenv import load_dotenv

load_dotenv()

def find_bot_name():
    token = os.getenv("SLACK_BOT_TOKEN")
    if not token:
        print("❌ No SLACK_BOT_TOKEN found in .env")
        return

    client = WebClient(token=token)
    try:
        response = client.auth_test()
        print(f"✅ Bot found!")
        print(f"Bot Name: @{response['user']}")
        print(f"Bot ID: {response['user_id']}")
        print(f"\n👉 Now go to your Slack channel and type: /invite @{response['user']}")
    except Exception as e:
        print(f"❌ Error finding bot: {e}")

if __name__ == "__main__":
    find_bot_name()

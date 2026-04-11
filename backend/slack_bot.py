import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv

load_dotenv()

client = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))
CHANNEL = os.getenv("SLACK_CHANNEL", "#all-meeting-mind")

def post_meeting_summary(meeting_data: dict) -> bool:
    """
    Posts meeting summary to Slack channel automatically
    """
    try:
        # Build action items text
        action_items_text = ""
        for item in meeting_data.get("action_items", []):
            action_items_text += f"• *{item['owner']}* → {item['task']} (Due: {item['deadline']})\n"

        # Build decisions text
        decisions_text = ""
        for d in meeting_data.get("decisions", []):
            decisions_text += f"• {d}\n"

        # Build open questions text
        questions_text = ""
        for q in meeting_data.get("open_questions", []):
            questions_text += f"• {q}\n"

        message = f"""
📋 *Meeting Summary — {meeting_data.get('meeting_title', 'Meeting')}*

📝 *Summary:*
{meeting_data.get('summary', '')}

✅ *Action Items:*
{action_items_text if action_items_text else '• None'}

🤝 *Decisions Made:*
{decisions_text if decisions_text else '• None'}

❓ *Open Questions:*
{questions_text if questions_text else '• None'}

📅 *Next Meeting:* {meeting_data.get('next_meeting', 'Not scheduled')}

_Powered by MeetingMind AI_ 🤖
"""

        response = client.chat_postMessage(
            channel=CHANNEL,
            text=message,
            mrkdwn=True
        )
        print(f"Slack message posted successfully: {response['ts']}")
        return True

    except SlackApiError as e:
        print(f"Slack error: {e.response['error']}")
        return False

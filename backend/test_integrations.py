import os
import json
from analyze import analyze_meeting
from slack_bot import post_meeting_summary
from jira_bot import create_jira_tickets
from email_sender import send_mom_email
from dotenv import load_dotenv

load_dotenv()

def run_verification():
    print("🚀 Starting End-to-End Integration Verification...")
    
    # 1. Mock Transcript
    mock_transcript = "John: We need to fix the login bug by tomorrow. Sarah: I will take that task. Let's decide to use OAuth. John: Agreed. We will meet again on Friday."
    mock_attendees = [{"name": "John Doe", "email": "bunnych2206@gmail.com"}]
    
    # 2. Test AI Analysis
    print("\n[1/4] Testing AI Analysis (Groq)...")
    try:
        meeting_data = analyze_meeting(mock_transcript, mock_attendees)
        print("✅ AI Analysis success!")
        print(f"Title: {meeting_data.get('meeting_title')}")
    except Exception as e:
        print(f"❌ AI Analysis failed: {e}")
        return

    # 3. Test Slack
    print("\n[2/4] Testing Slack Integration...")
    slack_success = post_meeting_summary(meeting_data)
    if slack_success:
        print("✅ Slack post success!")
    else:
        print("❌ Slack post failed (check token/channel)")

    # 4. Test Jira
    print("\n[3/4] Testing Jira Integration...")
    tickets = create_jira_tickets(meeting_data)
    if tickets:
        print(f"✅ Jira success! Created {len(tickets)} tickets.")
    else:
        print("❌ Jira failed (check credentials)")

    # 5. Test Email
    print("\n[4/4] Testing Email Integration...")
    email_success = send_mom_email(meeting_data, mock_attendees, tickets)
    if email_success:
        print("✅ Email sent success!")
    else:
        print("❌ Email failed (check Gmail App Password)")

    print("\n✨ Verification Complete!")

if __name__ == "__main__":
    run_verification()

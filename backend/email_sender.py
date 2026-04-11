import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_mom_email(meeting_data: dict, attendees: list, jira_tickets: list = None) -> bool:
    """
    Sends Minutes of Meeting email to all attendees automatically
    """
    try:
        sender_email = os.getenv("GMAIL_ADDRESS")
        app_password = os.getenv("GMAIL_APP_PASSWORD")

        # Get all attendee emails
        recipient_emails = [a["email"] for a in attendees if a.get("email")]

        if not recipient_emails:
            print("No recipient emails found")
            return False

        # Build email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Minutes of Meeting — {meeting_data.get('meeting_title', 'Meeting')}"
        msg["From"] = sender_email
        msg["To"] = ", ".join(recipient_emails)

        # Plain text version
        plain_text = meeting_data.get("mom_email", "")

        # HTML version (looks professional)
        action_rows = ""
        for item in meeting_data.get("action_items", []):
            ticket_link = ""
            if jira_tickets:
                for t in jira_tickets:
                    if t.get("task") == item.get("task"):
                        ticket_link = f" <a href='{t.get('url', '#')}' style='color:#1a73e8; font-size:12px; text-decoration:none;'>[{t.get('ticket_id')}]</a>"
                        break
                        
            action_rows += f"""
            <tr>
                <td style="padding:8px;border:1px solid #e0e0e0">{item['task']}{ticket_link}</td>
                <td style="padding:8px;border:1px solid #e0e0e0">{item['owner']}</td>
                <td style="padding:8px;border:1px solid #e0e0e0">{item['deadline']}</td>
            </tr>"""

        decisions_html = "".join([f"<li>{d}</li>" for d in meeting_data.get("decisions", [])])
        questions_html = "".join([f"<li>{q}</li>" for q in meeting_data.get("open_questions", [])])

        html = f"""
<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:700px;margin:auto;padding:20px">
    <div style="background:#1a73e8;color:white;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">📋 Minutes of Meeting</h2>
        <p style="margin:5px 0 0">{meeting_data.get('meeting_title', 'Meeting')}</p>
    </div>

    <div style="background:#f9f9f9;padding:20px;border:1px solid #e0e0e0">
        <h3 style="color:#1a73e8">Summary</h3>
        <p>{meeting_data.get('summary', '')}</p>

        <h3 style="color:#1a73e8">✅ Action Items</h3>
        <table style="width:100%;border-collapse:collapse">
            <tr style="background:#1a73e8;color:white">
                <th style="padding:8px;text-align:left">Task</th>
                <th style="padding:8px;text-align:left">Owner</th>
                <th style="padding:8px;text-align:left">Deadline</th>
            </tr>
            {action_rows}
        </table>

        <h3 style="color:#1a73e8">🤝 Decisions Made</h3>
        <ul>{decisions_html}</ul>

        <h3 style="color:#1a73e8">❓ Open Questions</h3>
        <ul>{questions_html}</ul>

        <h3 style="color:#1a73e8">📅 Next Meeting</h3>
        <p>{meeting_data.get('next_meeting', 'Not scheduled')}</p>
    </div>

    <div style="background:#f0f0f0;padding:10px;text-align:center;border-radius:0 0 8px 8px;font-size:12px;color:#888">
        Powered by MeetingMind AI 🤖 — Automated meeting intelligence
    </div>
</body>
</html>"""

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html, "html"))

        # Send via Gmail SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, recipient_emails, msg.as_string())

        print(f"MoM email sent to: {', '.join(recipient_emails)}")
        return True

    except Exception as e:
        print(f"Email error: {str(e)}")
        return False

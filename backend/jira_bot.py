import os
from jira import JIRA
from dotenv import load_dotenv

load_dotenv()

def create_jira_tickets(meeting_data: dict) -> list:
    """
    Creates Jira tickets for each action item automatically
    """
    try:
        jira = JIRA(
            server=os.getenv("JIRA_SITE_URL"),
            basic_auth=(
                os.getenv("JIRA_EMAIL"),
                os.getenv("JIRA_API_TOKEN")
            )
        )

        project_key = os.getenv("JIRA_PROJECT_KEY", "MM")
        created_tickets = []

        for item in meeting_data.get("action_items", []):
            issue_dict = {
                "project": {"key": project_key},
                "summary": f"{item['task']}",
                "description": f"""
Action item from meeting: {meeting_data.get('meeting_title', 'Meeting')}

Assigned to: {item['owner']}
Deadline: {item['deadline']}

Meeting Summary: {meeting_data.get('summary', '')}
""",
                "issuetype": {"name": "Task"},
            }

            new_issue = jira.create_issue(fields=issue_dict)
            created_tickets.append({
                "ticket_id": new_issue.key,
                "task": item["task"],
                "owner": item["owner"],
                "url": f"{os.getenv('JIRA_SITE_URL')}/browse/{new_issue.key}"
            })
            print(f"Created Jira ticket: {new_issue.key} for {item['owner']}")

        return created_tickets

    except Exception as e:
        print(f"Jira error: {str(e)}")
        return []

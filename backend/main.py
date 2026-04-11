from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import shutil
from dotenv import load_dotenv

from transcribe import transcribe_audio
from analyze import analyze_meeting
from slack_bot import post_meeting_summary
from jira_bot import create_jira_tickets
from email_sender import send_mom_email

load_dotenv()

app = FastAPI(title="MeetingMind AI", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "MeetingMind AI is running!"}

from db import save_meeting, get_all_meetings, delete_meeting

@app.get("/api/meetings")
def serve_meetings():
    return JSONResponse(get_all_meetings())

@app.delete("/api/meetings/{meeting_id}")
def delete_meeting_endpoint(meeting_id: str):
    success = delete_meeting(meeting_id)
    if success:
        return JSONResponse({"success": True})
    return JSONResponse({"success": False, "error": "Not found"}, status_code=404)

from status_tracker import tracker

@app.get("/process-status")
def get_status():
    return JSONResponse(tracker.get())

@app.post("/process-meeting")
async def process_meeting(
    audio: UploadFile = File(...),
    attendees: str = Form(...)
):
    audio_path = None
    try:
        # Step 1: Upload
        tracker.update(1, "Uploading & Saving Audio...", "Receiving file from browser.")
        attendees_list = json.loads(attendees)

        audio_path = f"temp_{audio.filename}"
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        
        # Step 2: Transcribe (This now auto-updates tracker internally)
        transcript = transcribe_audio(audio_path)

        # Step 3: Analyze (This now auto-updates tracker internally)
        meeting_data = analyze_meeting(transcript, attendees_list)

        # Step 4: Sync
        tracker.update(4, "Syncing Integrations...", "Slack, Jira, and Email distribution.")
        slack_success = post_meeting_summary(meeting_data)
        jira_tickets = create_jira_tickets(meeting_data)
        email_success = send_mom_email(meeting_data, attendees_list, jira_tickets)

        # Cleanup
        if audio_path and os.path.exists(audio_path): os.remove(audio_path)
        
        tracker.update(5, "Saving to Database...", "Storing meeting in MongoDB.")
        
        final_payload = {
            "transcript": transcript,
            "meeting_data": meeting_data,
            "jira_tickets": jira_tickets,
            "slack_posted": slack_success,
            "email_sent": email_success
        }
        
        from datetime import datetime
        meeting_record = {
            "title": meeting_data.get("meeting_title", "Untitled Meeting"),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "attendees": len(attendees_list),
            "tasks": len(meeting_data.get("action_items", [])),
            "data": final_payload
        }
        saved_meeting = save_meeting(meeting_record)
        
        tracker.update(6, "Complete!", "Redirecting to your results.")
        
        # Reset tracker for next run after a short delay
        return JSONResponse({
            "success": True,
            "meeting": saved_meeting
        })


    except Exception as e:
        PROCESS_STATUS = {"step": 0, "message": "Error encountered", "details": str(e)}
        if os.path.exists(audio_path): os.remove(audio_path)
        print(f"Error: {str(e)}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/transcribe-only")
async def transcribe_only(audio: UploadFile = File(...)):
    """
    Just transcribe audio, no AI analysis
    Useful for testing
    """
    try:
        audio_path = f"temp_{audio.filename}"
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)

        transcript = transcribe_audio(audio_path)
        os.remove(audio_path)

        return JSONResponse({
            "success": True,
            "transcript": transcript
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

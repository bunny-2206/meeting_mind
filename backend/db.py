import os
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "meetingmind"

# Set timeout to 2 seconds so it doesn't hang if Mongo isn't running yet
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client[DB_NAME]
meetings_col = db["meetings"]

def is_db_connected():
    try:
        client.admin.command('ping')
        return True
    except Exception:
        return False

def save_meeting(meeting_data: dict):
    if is_db_connected():
        meetings_col.insert_one(meeting_data)
        # remove the injected ObjectId after insert so it doesn't break JSON serialize
        if "_id" in meeting_data:
            meeting_data["id"] = str(meeting_data.pop("_id"))
        return meeting_data
    else:
        print("⚠️ MongoDB not connected. Database save skipped.")
        return meeting_data

def delete_meeting(meeting_id: str) -> bool:
    if is_db_connected():
        try:
            result = meetings_col.delete_one({"_id": ObjectId(meeting_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    return False

def get_all_meetings() -> list:
    if not is_db_connected():
        return []
    
    meetings = list(meetings_col.find().sort("_id", -1))
    for m in meetings:
        m["id"] = str(m.pop("_id"))
    return meetings

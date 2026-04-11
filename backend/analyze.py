import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

import time
import re
from status_tracker import tracker

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def clean_json_string(raw: str) -> str:
    """Removes invalid control characters and cleans up common AI hallucinatory prefixes."""
    # Remove control characters (but keep newlines)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', raw)
    # Extract JSON if wrapped in markdown
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0]
    return cleaned.strip()

def chunk_text(text: str, max_words: int = 1800): 
    words = text.split()
    for i in range(0, len(words), max_words):
        yield " ".join(words[i:i + max_words])

def analyze_meeting(transcript: str, attendees: list) -> dict:
    attendees_str = ", ".join([f"{a['name']} ({a['email']})" for a in attendees])
    words = transcript.split()
    tracker.update(3, "Analyzing Meeting...", f"Preparing {len(words)} words for AI.")
    
    if len(words) < 2500:
        return _call_ai(transcript, attendees_str)
    
    chunks = list(chunk_text(transcript))
    partial_results = []
    
    for i, chunk in enumerate(chunks):
        tracker.update(3, f"Analyzing Chunk {i+1}/{len(chunks)}", f"{len(chunk.split())} words")
        res = _call_ai(chunk, attendees_str, is_partial=True)
        partial_results.append(res)
    
    tracker.update(3, "Consolidating Results", "Combining individual chunk analyses.")
    return _combine_results(partial_results)

def _call_ai(transcript: str, attendees_str: str, is_partial: bool = False) -> dict:
    prompt = f"""
Meeting Analyst Task:
ATTENDEES: {attendees_str}
TRANSCRIPT:
{transcript}

Return JSON:
{{
  "meeting_title": "title",
  "summary": "concise summary",
  "action_items": [{{"task": "what", "owner": "who", "email": "email", "deadline": "when"}}],
  "decisions": ["dec 1"], "open_questions": ["q 1"], "next_meeting": "date",
  "labeled_highlights": "5 key dialogue highlights with speaker labels."
}}
Return ONLY JSON.
"""
    # AUTO-RETRY LOOP
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2000 
            )
            raw = response.choices[0].message.content.strip()
    
            try:
                cleaned = clean_json_string(raw)
                return json.loads(cleaned, strict=False)
            except Exception as e:
                print(f"JSON Error on attempt: {e}")
                # Final desperate attempt to fix the raw string for common issues
                try:
                    # Try to close any accidental open quotes
                    if '"' in cleaned and cleaned.count('"') % 2 != 0:
                        cleaned += '"'
                    if '}' not in cleaned:
                        cleaned += '}'
                    return json.loads(cleaned, strict=False)
                except:
                    pass
                
                return {
                    "meeting_title": "Section Analysis",
                    "summary": "Brief summary of this excerpt.",
                    "action_items": [], "decisions": [], "open_questions": [], "next_meeting": "Error",
                    "labeled_highlights": "Error parsing results."
                }
        except Exception as e:
            if "rate_limit" in str(e).lower() or "413" in str(e) or "429" in str(e):
                print(f"⚠️ Rate limit hit. Waiting 60s to retry (Attempt {attempt+1}/3)...")
                time.sleep(60)
                continue
            raise e

    return { "meeting_title": "Timeout Error", "summary": "Failed after retries.", "action_items": [], "decisions": [], "open_questions": [], "next_meeting": "N/A", "labeled_highlights": "" }

def _combine_results(results: list) -> dict:
    """Combines multiple partial JSON results into one master report."""
    
    def to_str(val):
        if isinstance(val, list):
            return "\n".join([str(v) for v in val])
        return str(val)

    master = {
        "meeting_title": to_str(results[0].get("meeting_title", "Meeting")),
        "summary": "\n\n".join([to_str(r.get("summary", "")) for r in results]),
        "action_items": [],
        "decisions": [],
        "open_questions": [],
        "next_meeting": to_str(results[-1].get("next_meeting", "Not scheduled")),
        "mom_email": "",
        "labeled_transcript": "\n\n".join([to_str(r.get("labeled_highlights", "")) for r in results])
    }
    
    for r in results:
        master["action_items"].extend(r.get("action_items", []))
        master["decisions"].extend(r.get("decisions", []))
        master["open_questions"].extend(r.get("open_questions", []))
    
    # Final cleanup
    master["decisions"] = list(set(to_str(d) for d in master["decisions"]))
    master["open_questions"] = list(set(to_str(q) for q in master["open_questions"]))
    
    # Generate unified email body
    master["mom_email"] = f"SUMMARY:\n{master['summary']}\n\nDECISIONS:\n" + "\n".join([f"- {d}" for d in master["decisions"]])
    return master

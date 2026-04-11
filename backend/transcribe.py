import os
import subprocess
import math
import whisper
import whisper
from groq import Groq
from dotenv import load_dotenv
from status_tracker import tracker

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_audio_duration(file_path: str) -> float:
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return float(result.stdout)

def transcribe_audio(audio_path: str) -> str:
    tracker.update(2, "Transcribing Audio...", "Checking Cloud availability...")
    try:
        file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        if file_size_mb < 24:
            with open(audio_path, "rb") as file:
                return client.audio.transcriptions.create(
                    file=(audio_path, file.read()), model="whisper-large-v3", response_format="text"
                )
        return _transcribe_cloud_chunked(audio_path)
    except Exception as e:
        if "429" in str(e) or "limit" in str(e).lower() or "413" in str(e):
            tracker.update(2, "Cloud Limit Reached", "Switching to Local CPU (Slow but steady)...")
            global local_model
            if local_model is None:
                local_model = whisper.load_model("base")
            result = local_model.transcribe(audio_path, verbose=True)
            return result["text"]
        raise e

def _transcribe_cloud_chunked(audio_path: str) -> str:
    duration = get_audio_duration(audio_path)
    chunk_seconds = 12 * 60 
    total_chunks = math.ceil(duration / chunk_seconds)
    full_transcript = []

    for i in range(total_chunks):
        tracker.update(2, f"Transcribing Part {i+1}/{total_chunks}", f"Minute {i*12} to {(i+1)*12}")
        start_time = i * chunk_seconds
        chunk_name = f"temp_chunk_{i}.mp3"
        
        subprocess.run([
            "ffmpeg", "-y", "-ss", str(start_time), "-t", str(chunk_seconds),
            "-i", audio_path, "-acodec", "libmp3lame", "-ab", "128k", chunk_name
        ], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        
        try:
            with open(chunk_name, "rb") as file:
                chunk_text = client.audio.transcriptions.create(
                    file=(chunk_name, file.read()), model="whisper-large-v3", response_format="text"
                )
            full_transcript.append(chunk_text)
        finally:
            if os.path.exists(chunk_name): os.remove(chunk_name)
        
    return " ".join(full_transcript)

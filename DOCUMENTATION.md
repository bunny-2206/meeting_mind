# MeetingMind AI - Comprehensive Architecture & Implementation Guide

This document serves as the "Master Blueprint" for the MeetingMind AI project. It was written to help you immediately understand the entire codebase, the flow of data, and the specific technological choices made whenever you return to this project in the future.

---

## 1. High-Level Architecture Flow
MeetingMind is designed as a fully autonomous pipeline. Once an audio file is introduced, the system requires zero human intervention to reach the final state.

**The Pipeline:**
1. **Input (UI):** User provides audio by uploading a file OR using the built-in browser microphone recorder. User provides a list of attendees (Name + Email).
2. **Transcription:** The `.mp3` / `.wav` / `.webm` file is sent to the backend and passed to the extremely fast Groq Whisper model to generate text.
3. **AI Analysis:** The raw text is passed to Llama 3 on Groq, which intelligently structures the conversation into predefined JSON objects identifying "Task", "Owner", and "Decisions".
4. **Automation / Syndication:** 
   - A Slack connection posts a high-level summary to the team channel.
   - A Jira connection opens dedicated engineering tickets for every Action Item assigned.
   - An Email sender formats an HTML table out of the extracted tasks and emails every attendee their Minutes of Meeting (MoM).
5. **Persistence:** The final JSON blob (including the returned Jira issue keys and Slack timestamps) is saved into MongoDB so it can be recalled instantly on the frontend dashboard.

---

## 2. The Technology Stack & "The Why"

### Front-End: Vanilla JS / HTML / CSS
*   **Why it was chosen:** React and Next.js require compiling, node_modules, and heavy build steps. Using Vanilla JS allowed us to build extremely fast, lightweight components. 
*   **Design Aspect:** We used a **"Premium Glassmorphism"** aesthetic. Rather than locking into Tailwind CSS classes, writing custom `styles.css` allowed precise control over dynamic blur effects, animations (like the recording pulse), and a very modern Next-Gen UI look.

### Back-End: FastAPI (Python)
*   **Why it was chosen:** Python is the undisputed king of AI. `FastAPI` specifically was chosen over Flask or Django because it uses modern asynchronous routing (`async`/`await`), which is strictly required when making heavy HTTP network requests to Groq, Slack, and Jira simultaneously without freezing the server.

### Database: MongoDB
*   **Why it was chosen:** AI models output dynamic JSON arrays (e.g. sometimes 1 action item, sometimes 5 decisions). Relational databases like Postgres force you to define strict tables. MongoDB is a NoSQL database, meaning it easily swallows massive, deeply nested JSON trees naturally without requiring complex schemas.

### AI Engine: Groq (Llama 3 & distil-whisper)
*   **Why it was chosen:** Speed. Traditional OpenAI models can take 30-60 seconds to process a meeting. Groq runs on proprietary LPU (Language Processing Units) chips that process text at ~800 tokens per second. This is what makes your dashboard feel incredibly fast.

---

## 3. Deep-Dive: Backend Modules (`/backend`)

*   **`main.py`**: The Router. This controls endpoints like `POST /process-meeting` and `DELETE /api/meetings/{id}`. It strings all the other modules together like a conductor.
*   **`transcribe.py`**: Uses `groq_client.audio.transcriptions.create`. This parses the raw audio.
*   **`analyze.py`**: The Brain. This contains the heavily engineered System Prompts. 
    *   *The Major Challenge:* Groq has a 6,000 Token-Per-Minute limit.
    *   *Our Solution:* We wrote a chunking algorithm in this file. It cuts the transcript into 500-word blocks, sends them to Llama 3 individually, and then aggressively merges the resulting JSON responses into one master array to prevent crashing.
*   **`jira_bot.py`**: Uses Atlassian's REST API with Basic Auth (Base64 encoded email:token) to spin up issue tickets.
*   **`slack_bot.py`**: Uses basic HTTP hooks to fire messages to specific workspace channels.
*   **`email_sender.py`**: Uses Python's `smtplib`. It dynamically builds an HTML grid to look professional and injects the live Jira Ticket hyper-links next to the email task assignments.
*   **`db.py`**: Uses `pymongo` to connect natively to local `localhost:27017` databases, with error-handling bounds so the app doesn't crash if the database turns off.

---

## 4. Deep-Dive: Frontend Modules (`/frontend/js`)

*   **`app.js`**: The minimal Router. It hides and shows HTML fragments based on the `currentPage` state so the user never has to reload the browser.
*   **`api.js`**: Home to `window.MeetingStore`. This is our "State Manager". It talks to the backend, `fetch()` the meetings from MongoDB, and holds them in memory so the Dashboard charts can render instantly. It also houses our complex UI State-Machine for deleting meetings (the double-click "Sure?" confirmation button).
*   **`analyze.js`**: Contains the magic for **Live Audio Recording**. Instead of just parsing files, it uses `navigator.mediaDevices.getUserMedia()` to tap into the laptop mic, record byte streams live via the `MediaRecorder` API, and package them nicely into standard `.webm` files.
*   **`results.js` / `dashboard.js` / `history.js` / `actions.js`**: Visual rendering scripts. They take JSON arrays and return neatly formatted HTML templates.

---

## 5. Security & Environment Keys (`.env`)
All major keys must be provided in `backend/.env`. By keeping them in the `.env`, they are isolated from source code, preventing security leaks if uploaded to GitHub.
*   `GROQ_API_KEY`: Connects to LLMs.
*   `GMAIL_ADDRESS` / `GMAIL_APP_PASSWORD`: Needed to bypass Google's intense scraping blocks.
*   `JIRA_SITE_URL` / `JIRA_EMAIL` / `JIRA_API_TOKEN`: Used to generate Agile boards.
*   `MONGO_URI`: The connection string, used for plugging into AWS/Atlas cloud architectures easily in the future.

---

## 6. How To Turn The Car On (Startup Run Book)

If you step away for 3 months and forget how to boot the app, run the following in VSCode:

**Terminal 1 (Backend):**
```bash
cd backend
# Make sure your pip packages (fastapi, python-multipart, pymongo, groq) are installed
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
# A simple local server bypasses strict CORS
npm run dev # (requires running 'npm install -g lite-server' or similar initially)
```

**Database:**
Ensure your MongoDB local service is enabled via Windows Services or simply use an Atlas string in the `.env`.

*End of Document. Build the Future!*

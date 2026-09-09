# 🧠 MeetingMind AI

> **Turn meetings into action — automatically.**

MeetingMind AI is an autonomous **AI-powered Meeting Intelligence & Automation Platform** that transforms raw meeting audio into structured Minutes of Meeting (MoM), action items, decisions, Jira tickets, Slack updates, and attendee emails — with **zero manual intervention**.

---

## ✨ What is MeetingMind AI?

MeetingMind AI takes a meeting through the complete pipeline:

**🎙️ Audio → 📝 Transcript → 🧠 AI Analysis → ✅ Action Items → 🎫 Jira → 💬 Slack → 📧 Email → 💾 MongoDB**

Users can:

- 📁 Upload an `.mp3`, `.wav`, or `.webm` recording
- 🎙️ Record a meeting directly using the browser microphone
- 👥 Provide attendee names and email addresses

Once submitted, the entire processing pipeline runs automatically.

---

# 🚀 Key Features

| Feature | Description |
|---|---|
| 🎙️ **Live Recording** | Record meetings directly from the browser |
| 📁 **Audio Upload** | Support for common audio formats |
| ⚡ **Fast Transcription** | Groq Whisper-powered transcription |
| 🧠 **AI Meeting Analysis** | Llama 3 extracts structured meeting intelligence |
| ✅ **Action Items** | Automatically identifies tasks and owners |
| 📌 **Decisions** | Extracts important decisions |
| 🎫 **Jira Automation** | Creates Jira issues for engineering action items |
| 💬 **Slack Integration** | Publishes meeting summaries to team channels |
| 📧 **MoM Email** | Sends professionally formatted meeting minutes |
| 💾 **MongoDB Persistence** | Stores complete meeting intelligence |
| 📊 **Dashboard** | Visualizes meeting history and actions |
| 🔄 **SPA-like Navigation** | Navigate without full-page reloads |
| 🪟 **Premium UI** | Glassmorphism-based modern interface |

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │        USER          │
                         │                      │
                         │ Upload Audio OR      │
                         │ Record via Microphone│
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FRONTEND        │
                         │   HTML / CSS / JS    │
                         └──────────┬───────────┘
                                    │
                              HTTP Request
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       FASTAPI        │
                         │       main.py        │
                         │       Router         │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
          ┌──────────────────┐             ┌──────────────────┐
          │   Transcription  │             │   Meeting Data   │
          │   transcribe.py  │             │    Processing    │
          └────────┬─────────┘             └──────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │   Groq Whisper   │
          │   Audio → Text   │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │   AI Analysis    │
          │    analyze.py    │
          └────────┬─────────┘
                   │
                   ▼
          ┌────────────────────────────┐
          │       Llama 3 on Groq      │
          │                            │
          │ Tasks • Owners • Decisions │
          └────────────┬───────────────┘
                       │
                       ▼
                Structured JSON
                       │
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
 ┌────────────┐ ┌────────────┐ ┌──────────────┐
 │    Jira    │ │   Slack    │ │    Email     │
 │   Tickets  │ │  Summary   │ │     MoM      │
 └─────┬──────┘ └─────┬──────┘ └──────┬───────┘
       │              │               │
       └──────────────┼───────────────┘
                      │
                      ▼
             ┌──────────────────┐
             │     MongoDB      │
             │                  │
             │ Final JSON Blob  │
             │ + Jira Keys      │
             │ + Slack Metadata │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │     Dashboard    │
             │ History / Tasks  │
             │ Decisions / Data │
             └──────────────────┘

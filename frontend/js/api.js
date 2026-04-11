// ── API.JS ──
// Handles all communication with the FastAPI backend
// All other JS files use these functions

const API_BASE = "http://localhost:8000";

// Global meetings store (shared across all pages)
window.MeetingStore = {
  meetings: [],

  async fetchAll() {
    try {
      const res = await fetch(`${API_BASE}/api/meetings`);
      if (res.ok) {
        this.meetings = await res.json();
        
        // Refresh UI if necessary
        if (window.renderHistory && window.location.hash === "#history") {
            const main = document.getElementById("main-content");
            if(main) main.innerHTML = window.renderHistory();
        }
      }
    } catch (e) {
      console.warn("Could not fetch meetings from DB:", e);
    }
  },

  async delete(meetingId) {
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}`, {
         method: "DELETE"
      });
      if (res.ok) {
         await this.fetchAll();
      }
    } catch (e) {
      console.warn("Could not delete meeting:", e);
    }
  },

  getAll() {
    return this.meetings;
  },

  getStats() {
    return {
      total: this.meetings.length,
      tasks: this.meetings.reduce((s, m) => s + (m.data?.meeting_data?.action_items?.length || 0), 0),
      decisions: this.meetings.reduce((s, m) => s + (m.data?.meeting_data?.decisions?.length || 0), 0),
      emails: this.meetings.filter(m => m.data?.email_sent).length
    };
  },

  getAllActions() {
    return this.meetings.flatMap(m =>
      (m.data?.meeting_data?.action_items || []).map(item => ({
        ...item,
        meeting_title: m.title,
        date: m.date
      }))
    );
  }
};

window.attemptDelete = async (id, btn) => {
   if (btn.innerText.includes("🗑️")) {
       btn.innerText = "Sure?";
       btn.style.backgroundColor = "rgba(239, 68, 68, 0.4)"; // Deep red to grab attention
       btn.style.fontWeight = "bold";
       
       // Automatically reset if they don't click again within 3 seconds
       setTimeout(() => {
           if (btn.innerText === "Sure?") {
               btn.innerText = "🗑️";
               btn.style.backgroundColor = ""; 
               btn.style.fontWeight = "";
           }
       }, 3000);
   } else if (btn.innerText === "Sure?") {
       btn.innerText = "⏳";
       await window.MeetingStore.delete(id);
       
       // Force a render refresh correctly using the global navigateTo function
       const activePage = window.location.hash.replace("#", "") || "dashboard";
       if (typeof navigateTo === "function") navigateTo(activePage);
   }
};

// Process full meeting (audio + attendees)
async function processMeeting(audioFile, attendees) {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("attendees", JSON.stringify(attendees));

  const response = await fetch(`${API_BASE}/process-meeting`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Server error: " + response.status);
  }
  return data;
}
async function getProcessStatus() {
  const response = await fetch(`${API_BASE}/process-status`);
  return response.json();
}

// Mock data for demo/testing when backend is offline
function getMockResult() {
  return {
    success: true,
    transcript: "Ravi: We should launch the product by Friday. Priya: I agree but the budget is still unconfirmed. Sam: I will send the proposal by EOD today. Ravi: Team agreed to delay the full launch by 2 weeks. Priya: Budget meeting scheduled for Monday at 10 AM.",
    meeting_data: {
      meeting_title: "Product Launch Planning",
      summary: "Team discussed product launch timeline and budget concerns. Launch delayed by 2 weeks pending budget confirmation.",
      action_items: [
        { task: "Send product proposal", owner: "Sam",   email: "sam@company.com",   deadline: "Today EOD" },
        { task: "Confirm budget",        owner: "Priya", email: "priya@company.com", deadline: "Monday" },
        { task: "Prepare launch checklist", owner: "Ravi", email: "ravi@company.com", deadline: "Friday" }
      ],
      decisions: [
        "Product launch delayed by 2 weeks",
        "Budget review meeting set for Monday"
      ],
      open_questions: [
        "Final budget amount still unconfirmed",
        "Marketing campaign start date unclear"
      ],
      next_meeting: "Monday 10:00 AM",
      mom_email: "Dear Team,\n\nMinutes of Meeting — Product Launch Planning\n\nSUMMARY:\nLaunch delayed 2 weeks. Budget review Monday.\n\nACTION ITEMS:\n• Sam → Send proposal (Today EOD)\n• Priya → Confirm budget (Monday)\n• Ravi → Launch checklist (Friday)\n\nDECISIONS:\n• Product launch delayed by 2 weeks\n• Budget review set for Monday\n\nOPEN QUESTIONS:\n• Budget unconfirmed\n• Marketing start date unclear\n\nNext Meeting: Monday 10:00 AM\n\n— MeetingMind AI"
    },
    jira_tickets: [
      { ticket_id: "MM-1", task: "Send product proposal",     owner: "Sam",   url: "#" },
      { ticket_id: "MM-2", task: "Confirm budget",            owner: "Priya", url: "#" },
      { ticket_id: "MM-3", task: "Prepare launch checklist",  owner: "Ravi",  url: "#" }
    ],
    slack_posted: true,
    email_sent: true
  };
}

// ── RESULTS.JS ──
// Displays AI extracted results: tasks, decisions, email, jira tickets

function renderResults(meeting) {
  if (!meeting) meeting = window.lastResult;
  if (!meeting) {
    return `
      <div class="page-title">Results</div>
      <div class="empty-state">
        No results yet.<br>Process a meeting first! 🎙️<br><br>
        <button class="btn btn-primary" onclick="navigateTo('analyze')">Go to Analyze</button>
      </div>
    `;
  }

  const result = meeting.data || meeting;
  const md = result.meeting_data;


  return `
    <div class="page-title">${md.meeting_title}</div>
    <div class="page-sub">${md.summary}</div>

    <div class="success-banner">
      ✅ Done! Slack posted · Jira tickets created · MoM email sent
    </div>

    <button class="btn btn-secondary" onclick="navigateTo('analyze')" style="margin-bottom:1rem">
      ← Analyze Another Meeting
    </button>

    <!-- TRANSCRIPT -->
    <div class="card">
      <div class="card-title">🎙️ Labeled Transcript</div>
      <div class="email-preview" style="white-space: pre-wrap;">${md.labeled_transcript || result.transcript}</div>
    </div>

    <!-- ACTION ITEMS -->
    <div class="card">
      <div class="card-title">✅ Action Items</div>
      ${md.action_items.map(item => `
        <div class="result-item">
          <span class="result-icon">📌</span>
          <div style="flex:1">
            <div>${item.task}</div>
            <div style="font-size:.7rem;color:#64748b;margin-top:3px">Due: ${item.deadline}</div>
          </div>
          <span class="result-owner">${item.owner}</span>
        </div>
      `).join("")}
    </div>

    <!-- DECISIONS + QUESTIONS -->
    <div class="two-col">
      <div class="card">
        <div class="card-title">🤝 Decisions Made</div>
        ${md.decisions.map(d => `
          <div class="result-item">
            <span class="result-icon">✅</span>
            <span>${d}</span>
          </div>
        `).join("")}
      </div>
      <div class="card">
        <div class="card-title">❓ Open Questions</div>
        ${md.open_questions.map(q => `
          <div class="result-item">
            <span class="result-icon">❓</span>
            <span>${q}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- JIRA TICKETS -->
    <div class="card">
      <div class="card-title">📋 Jira Tickets Created</div>
      ${result.jira_tickets.map(t => `
        <div class="ticket-row">
          <span class="ticket-id">${t.ticket_id}</span>
          <span style="flex:1;margin:0 .75rem">${t.task}</span>
          <span class="tag tag-blue">${t.owner}</span>
        </div>
      `).join("")}
    </div>

    <!-- MOM EMAIL -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
        <div class="card-title" style="margin:0">
          📧 MoM Email
          ${result.email_sent ? '<span class="tag tag-green" style="margin-left:8px">Sent ✅</span>' : ""}
        </div>
        <button class="btn btn-secondary" style="font-size:.75rem;padding:5px 10px"
          onclick="navigator.clipboard.writeText(document.getElementById('mom-text').innerText)">
          Copy
        </button>
      </div>
      <div class="email-preview" id="mom-text">${md.mom_email}</div>
    </div>

    <!-- INTEGRATION STATUS -->
    <div class="card">
      <div class="card-title">🔗 Integration Status</div>
      <div class="integration-row">
        <a href="https://app.slack.com/client" target="_blank" class="tag ${result.slack_posted ? 'tag-green' : 'tag-red'}" style="text-decoration:none; cursor:pointer;">
          💬 Slack ${result.slack_posted ? "Posted ✅" : "Failed ❌"}
        </a>
        <span class="tag ${result.email_sent ? 'tag-green' : 'tag-red'}">
          📧 Email ${result.email_sent ? "Sent ✅" : "Failed ❌"}
        </span>
        <a href="${result.jira_tickets && result.jira_tickets.length > 0 ? result.jira_tickets[0].url.split('/browse/')[0] : 'https://id.atlassian.com/'}" target="_blank" class="tag ${result.jira_tickets && result.jira_tickets.length > 0 ? 'tag-green' : 'tag-red'}" style="text-decoration:none; cursor:pointer;">
          📋 ${result.jira_tickets ? result.jira_tickets.length : 0} Jira Tickets ✅
        </a>
        <span class="tag tag-blue">
          📅 Next: ${md.next_meeting}
        </span>
      </div>
    </div>
  `;
}

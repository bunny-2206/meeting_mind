// ── DASHBOARD.JS ──
// Renders the dashboard page with stats and recent meetings

function renderDashboard() {
  const stats = window.MeetingStore.getStats();
  const meetings = window.MeetingStore.getAll();

  const recentMeetings = meetings.length === 0
    ? `<div class="empty-state">
        No meetings yet.<br>Go to "Analyze Meeting" to get started! 🎙️
       </div>`
    : meetings.slice(0, 5).map(m => `
        <div class="meeting-row" onclick="navigateTo('results', ${JSON.stringify(m.data).replace(/"/g, '&quot;')})">
          <span style="font-size:1.4rem">📋</span>
          <div style="flex:1">
            <div style="font-weight:600;font-size:.88rem">${m.title}</div>
            <div style="font-size:.73rem;color:#64748b">${m.date} · ${m.attendees} attendees · ${m.tasks} tasks</div>
          </div>
          <div style="display:flex; gap: 8px;">
              <span class="tag tag-blue">${m.tasks} tasks</span>
              <button class="btn btn-danger" style="padding: 4px; font-size: 0.8rem; width: 62px; text-align: center;" onclick="event.stopPropagation(); window.attemptDelete('${m.id}', this)" title="Delete Meeting">🗑️</button>
          </div>
        </div>`
    ).join("");

  return `
    <div class="page-title">Dashboard</div>
    <div class="page-sub">Overview of all your meetings</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div style="font-size:1.4rem;margin-bottom:6px">📋</div>
        <div class="stat-val">${stats.total}</div>
        <div class="stat-label">Total Meetings</div>
      </div>
      <div class="stat-card">
        <div style="font-size:1.4rem;margin-bottom:6px">✅</div>
        <div class="stat-val">${stats.tasks}</div>
        <div class="stat-label">Action Items</div>
      </div>
      <div class="stat-card">
        <div style="font-size:1.4rem;margin-bottom:6px">🤝</div>
        <div class="stat-val">${stats.decisions}</div>
        <div class="stat-label">Decisions Made</div>
      </div>
      <div class="stat-card">
        <div style="font-size:1.4rem;margin-bottom:6px">📧</div>
        <div class="stat-val">${stats.emails}</div>
        <div class="stat-label">Emails Sent</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Recent Meetings</div>
      ${recentMeetings}
    </div>
  `;
}

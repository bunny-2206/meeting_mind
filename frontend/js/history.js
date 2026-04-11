// ── HISTORY.JS ──
// Shows all past meetings in a list

function renderHistory() {
  const meetings = window.MeetingStore.getAll();

  const list = meetings.length === 0
    ? `<div class="empty-state">No meetings yet! Process your first meeting 🎙️</div>`
    : meetings.map(m => `
        <div class="meeting-row" onclick="navigateTo('results', ${JSON.stringify(m.data).replace(/"/g, '&quot;')})">
          <span style="font-size:1.4rem">📋</span>
          <div style="flex:1">
            <div style="font-weight:600;font-size:.88rem">${m.title}</div>
            <div style="font-size:.73rem;color:#64748b">
              ${m.date} · ${m.attendees} attendees · ${m.tasks} tasks
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="tag tag-blue">${m.tasks} tasks</span>
            <button class="btn btn-danger" style="padding: 4px; font-size: 0.8rem; width: 62px; text-align: center;" onclick="event.stopPropagation(); window.attemptDelete('${m.id}', this)" title="Delete Meeting">🗑️</button>
          </div>
        </div>
      `).join("");

  return `
    <div class="page-title">Meeting History</div>
    <div class="page-sub">All past meetings — click any to view full results</div>
    <div class="card">
      <div class="card-title">All Meetings (${meetings.length})</div>
      ${list}
    </div>
  `;
}

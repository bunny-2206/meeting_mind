// ── ACTIONS.JS ──
// Shows all action items across all meetings

function renderActions() {
  const actions = window.MeetingStore.getAllActions();
  
  if (actions.length === 0) {
    return `
      <div class="page-title">Action Tracker</div>
      <div class="empty-state">No action items yet! Process a meeting first 🎙️</div>
    `;
  }

  // Group by meeting
  const grouped = {};
  actions.forEach(a => {
    if (!grouped[a.meeting_title]) grouped[a.meeting_title] = [];
    grouped[a.meeting_title].push(a);
  });

  const list = Object.keys(grouped).map(title => `
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title" style="color:var(--primary); border-bottom:1px solid #e2e8f0; padding-bottom:10px; margin-bottom:10px;">
        📄 ${title}
      </div>
      <div>
      ${grouped[title].map(item => `
        <div class="result-item">
          <span class="result-icon">📌</span>
          <div style="flex:1">
            <div>${item.task}</div>
            <div style="font-size:.7rem;color:#64748b;margin-top:3px">
              Due: ${item.deadline}
            </div>
          </div>
          <span class="result-owner">${item.owner}</span>
        </div>
      `).join("")}
      </div>
    </div>
  `).join("");

  return `
    <div class="page-title">Action Tracker</div>
    <div class="page-sub">All tasks organized by their respective meetings</div>
    ${list}
  `;
}

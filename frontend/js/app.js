// ── APP.JS ──
// Main router — controls which page is shown
// This is the last script to load

const PAGES = [
  { id: "dashboard", icon: "📊", label: "Dashboard",       render: () => renderDashboard() },
  { id: "analyze",   icon: "🎙️", label: "Analyze Meeting", render: () => renderAnalyze() },
  { id: "results",   icon: "📄", label: "Results",         render: (data) => renderResults(data) },
  { id: "history",   icon: "📋", label: "Meeting History", render: () => renderHistory() },
  { id: "actions",   icon: "✅", label: "Action Tracker",  render: () => renderActions() },
];

let currentPage = "dashboard";

// ── RENDER SIDEBAR ──
function renderSidebar() {
  document.getElementById("sidebar").innerHTML = PAGES.map(p => `
    <div
      class="nav-item ${currentPage === p.id ? 'active' : ''}"
      onclick="navigateTo('${p.id}')"
    >
      <span class="nav-icon">${p.icon}</span>
      <span>${p.label}</span>
    </div>
  `).join("");
}

// ── NAVIGATE TO PAGE ──
function navigateTo(pageId, data = null) {
  currentPage = pageId;

  const page = PAGES.find(p => p.id === pageId);
  if (!page) return;

  // Update sidebar active state
  renderSidebar();

  // Render page content
  document.getElementById("main-content").innerHTML = page.render(data);
  if (pageId !== "results") {
      window.location.hash = pageId;
  }
}

// ── INIT APP ──
async function init() {
  renderSidebar();
  
  // Show brief loading state
  document.getElementById("main-content").innerHTML = `
    <div class="empty-state" style="margin-top:20%">
      <div class="spinner" style="width:30px;height:30px;border-width:4px;"></div>
      <div style="margin-top:15px;color:#94a3b8;font-weight:600;">Loading Meeting Data...</div>
    </div>
  `;

  // Fetch initial data from back-end database
  if (window.MeetingStore && window.MeetingStore.fetchAll) {
      await window.MeetingStore.fetchAll();
  }
  
  // Route handling
  const hash = window.location.hash.replace("#", "");
  if (hash && PAGES.find(p => p.id === hash) && hash !== "results") {
      navigateTo(hash);
  } else {
      navigateTo("dashboard");
  }
}

// Start the app
init();

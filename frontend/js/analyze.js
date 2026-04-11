// ── ANALYZE.JS ──
// Handles audio upload, attendee input, and meeting processing

let attendees = [{ name: "", email: "" }];
let audioFile = null;
let currentStep = 0;
let isProcessing = false;

const STEP_LABELS = ["Upload", "Transcribe", "AI Analyse", "Sync & Email", "Done"];
let currentStatus = {
  step: 0,
  message: "Ready to process",
  details: ""
};

function renderAnalyze() {
  if (isProcessing) {
    return `
      <div class="page-title">Analyzing Meeting...</div>
      ${renderSteps()}
      <div id="status-card-container">
        ${renderProcessingCard()}
      </div>
      <div class="card" style="opacity: 0.5; pointer-events: none;">
        <div class="card-title">Attendee Details (Locked)</div>
        ${renderAttendeeRows()}
      </div>
    `;
  }

  return `
    <div class="page-title">Analyze Meeting</div>
    <div class="page-sub">Upload audio — AI handles everything automatically</div>

    ${renderSteps()}

    <div class="card">
      <div class="card-title">Meeting Attendees</div>
      <div id="attendees-list">
        ${renderAttendeeRows()}
      </div>
      <button class="btn btn-secondary" onclick="addAttendee()" style="margin-top:6px;font-size:.78rem">
        + Add Attendee
      </button>
    </div>

    <div class="card">
      <div class="card-title">Meeting Audio</div>
      <div
        class="upload-area ${audioFile ? 'has-file' : ''}"
        id="upload-area"
        onclick="document.getElementById('audioInput').click()"
        ondragover="handleDragOver(event)"
        ondragleave="handleDragLeave()"
        ondrop="handleDrop(event)"
      >
        <div class="upload-icon">🎙️</div>
        ${audioFile
      ? `<div style="color:#4ade80;font-weight:600">${audioFile.name}</div>
             <div style="font-size:.73rem;color:#64748b;margin-top:3px">${(audioFile.size / 1024 / 1024).toFixed(2)} MB</div>`
      : `<div class="upload-text">
               Drop audio file here or <span>click to browse</span><br>
               <span style="font-size:.72rem;color:#475569">Supports MP3, MP4, WAV, M4A</span>
             </div>`
    }
        <input id="audioInput" type="file" accept="audio/*,video/*"
          style="display:none" onchange="handleFileSelect(event)"/>
      </div>
    </div>

    <button
      class="btn btn-primary btn-full"
      onclick="handleProcess()"
      ${isProcessing ? "disabled" : ""}
    >
      ${isProcessing
      ? '<span class="spinner"></span> Processing...'
      : "🚀 Process Meeting — Full Auto"
    }
    </button>
  `;
}

function renderSteps() {
  return `
    <div class="steps">
      ${STEP_LABELS.map((label, i) => `
        <div class="step">
          <div class="step-circle ${i + 1 <= currentStatus.step ? 'done' : i + 1 === currentStatus.step + 1 && isProcessing ? 'active' : ''}">
            ${i + 1 <= currentStatus.step ? "✓" : i + 1}
          </div>
          <div class="step-label">${label}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderProcessingCard() {
  const pct = Math.round((currentStatus.step / 5) * 100);
  const isDone = currentStatus.step === 5;

  return `
    <div class="card" style="border: 2px solid ${isDone ? '#10b981' : 'var(--primary)'}; background: ${isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(59, 130, 246, 0.05)'};">
      <div class="processing-status">
        ${isDone ? '<div class="done-icon">✅</div>' : '<div class="spinner"></div>'}
        <div style="flex: 1">
           <div style="font-weight: 600; color: ${isDone ? '#059669' : 'var(--primary)'};">${currentStatus.message}</div>
           <div style="font-size: 0.72rem; color: var(--slate-500); margin-top: 2px;">${currentStatus.details}</div>
        </div>
        ${isDone ? `
          <button class="btn btn-primary" onclick="window.location.hash='#results'; navigateTo('results')" style="padding: 8px 16px; font-size: 0.8rem">
            View Results ➔
          </button>
        ` : ''}
      </div>
      <div class="progress-bar" style="margin-top: 15px;">
        <div class="progress-fill" style="width:${pct}%; background: ${isDone ? '#10b981' : ''}"></div>
      </div>
    </div>
  `;
}

function renderAttendeeRows() {
  return attendees.map((a, i) => `
    <div class="attendee-row">
      <input
        placeholder="Full name"
        value="${a.name}"
        onchange="updateAttendee(${i}, 'name', this.value)"
      />
      <input
        placeholder="Email address"
        value="${a.email}"
        onchange="updateAttendee(${i}, 'email', this.value)"
      />
      ${attendees.length > 1
      ? `<button class="btn btn-danger" onclick="removeAttendee(${i})">✕</button>`
      : `<div></div>`
    }
    </div>
  `).join("");
}

// ── ATTENDEE HANDLERS ──
function addAttendee() {
  attendees.push({ name: "", email: "" });
  document.getElementById("attendees-list").innerHTML = renderAttendeeRows();
}

function removeAttendee(index) {
  attendees.splice(index, 1);
  document.getElementById("attendees-list").innerHTML = renderAttendeeRows();
}

function updateAttendee(index, field, value) {
  attendees[index][field] = value;
}

// ── FILE HANDLERS ──
function handleFileSelect(event) {
  audioFile = event.target.files[0];
  navigateTo("analyze");
}

function handleDragOver(event) {
  event.preventDefault();
  document.getElementById("upload-area").classList.add("drag");
}

function handleDragLeave() {
  document.getElementById("upload-area").classList.remove("drag");
}

function handleDrop(event) {
  event.preventDefault();
  audioFile = event.dataTransfer.files[0];
  navigateTo("analyze");
}

// ── PROCESS MEETING ──
async function handleProcess() {
  const validAttendees = attendees.filter(a => a.name && a.email);

  if (!audioFile) return alert("Please upload an audio file!");
  if (validAttendees.length === 0) return alert("Please add at least one attendee with name and email!");

  isProcessing = true;
  currentStatus = { step: 1, message: "Initializing...", details: "Preparing files for processing" };
  navigateTo("analyze");

  // Real-time status polling
  const statusInterval = setInterval(async () => {
    try {
      const status = await getProcessStatus();
      if (status.step !== currentStatus.step || status.message !== currentStatus.message) {
        currentStatus = status;
        // Update ONLY the progress UI, not the whole page
        const container = document.getElementById("status-card-container");
        const steps = document.getElementById("steps-container");
        if (container) container.innerHTML = renderProcessingCard();
        if (steps) steps.innerHTML = renderSteps();
      }
    } catch (err) {
      console.warn("Status poll error:", err);
    }
  }, 1500);

  try {
    const result = await processMeeting(audioFile, validAttendees);
    clearInterval(statusInterval);
    isProcessing = false;

    if (result.success) {
      isProcessing = false;
      saveAndShowResult(result, validAttendees);
    } else {
      throw new Error(result.error);
    }
  } catch (err) {
    clearInterval(statusInterval);
    isProcessing = false;
    currentStatus = { step: 0, message: "Error", details: err.message };
    alert("Error processing meeting: " + err.message);
    navigateTo("analyze");
  }
}

function saveAndShowResult(result, validAttendees) {
  const meeting = result.meeting;

  // Save to store and sync with DB
  window.lastResult = meeting;
  window.MeetingStore.fetchAll(); // pulls latest from DB

  // Transition to results page
  window.location.hash = "#results";
  if (window.renderResults) {
    setTimeout(() => {
      const main = document.getElementById("main-content");
      main.innerHTML = renderResults(meeting);
    }, 50);
  }
}


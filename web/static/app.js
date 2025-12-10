// Xcellent1 Lawn Care - Worker Recruitment & Field Management
// Designed for hiring lawn care workers and managing field operations

const API_BASE = "";
const POLL_INTERVAL = 20000; // 20 seconds
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ========================================
// Helper Functions
// ========================================

async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error("[fetchJSON] Error:", err);
    throw new Error(err.message || "Network error occurred");
  }
}

function showMessage(containerId, message, type = "info", duration = 5000) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="message ${type}" role="alert">${message}</div>`;
  container.setAttribute("aria-live", "polite");
  if (duration > 0) {
    setTimeout(() => {
      container.innerHTML = "";
    }, duration);
  }
}

function clearMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = "";
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function formatDate(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const increment = target > current ? 1 : -1;
  const steps = Math.abs(target - current);
  const duration = Math.min(steps * 50, 500);
  const stepTime = duration / steps;
  let count = current;
  const timer = setInterval(() => {
    count += increment;
    if (
      (increment > 0 && count >= target) ||
      (increment < 0 && count <= target)
    ) {
      count = target;
      clearInterval(timer);
    }
    el.textContent = count;
  }, stepTime);
}

// ========================================
// Worker Application Form (index.html)
// ========================================

if (document.getElementById("lead-form")) {
  const form = document.getElementById("lead-form");
  const submitBtn = document.getElementById("submit-btn");
  const statusDiv = document.getElementById("form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage("form-status");

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const notes = form.notes.value.trim();

    // Validation
    if (name.length < 2) {
      return showMessage(
        "form-status",
        "Name must be at least 2 characters",
        "error"
      );
    }
    if (!phone) {
      return showMessage("form-status", "Phone number is required", "error");
    }
    if (!email || !isValidEmail(email)) {
      return showMessage(
        "form-status",
        "Please enter a valid email address",
        "error"
      );
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner"></span> Submitting Application...';

    try {
      const data = await fetchJSON(`${API_BASE}/api/leads`, {
        method: "POST",
        body: JSON.stringify({
          name,
          phone,
          email,
          notes,
          source: "careers", // Recruitment applications
        }),
      });

      showMessage(
        "form-status",
        `✓ <strong>Application Received!</strong><br><br>🎯 Application ID: <strong>${data.id}</strong><br><br>📞 <strong>What's Next?</strong><br>Our hiring manager will review your application and call you within <strong>48 hours</strong> to schedule an interview.<br><br>📧 Check your email (including spam folder) for confirmation.<br><br>👍 <strong>Pro Tip:</strong> Save our number so you don't miss the call!`,
        "success",
        0
      );

      form.reset();
      statusDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      showMessage(
        "form-status",
        `✗ <strong>Submission Error:</strong> ${err.message}<br><br>Please try again or call our hiring line: <strong>(555) 867-5309</strong>`,
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "📨 Submit Application";
    }
  });

  form.email.addEventListener("blur", (e) => {
    const email = e.target.value.trim();
    if (email && !isValidEmail(email)) {
      e.target.setAttribute("aria-invalid", "true");
      showMessage(
        "form-status",
        "Please enter a valid email address",
        "warning",
        3000
      );
    } else {
      e.target.removeAttribute("aria-invalid");
    }
  });
}

// Waitlist Form (home.html) — handle multi-step waitlist form
if (document.getElementById("waitlist-form")) {
  const form = document.getElementById("waitlist-form");
  const statusDivId = "waitlist-status";

  async function handleWaitlist(e) {
    e.preventDefault();
    clearMessage(statusDivId);
      const nameEl = form.querySelector('[name="name"]');
      const emailEl = form.querySelector('[name="email"]');
      const serviceEl = form.querySelector('[name="service"]');
      const phoneEl = form.querySelector('[name="phone"]') || document.getElementById('waitlist-phone');
      const addressEl = form.querySelector('[name="property_address"]') || document.getElementById('waitlist-address');
    const name = nameEl ? nameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim() : "";
    const service = serviceEl ? serviceEl.value : "";
    const phone = phoneEl ? (phoneEl.value ? phoneEl.value.trim() : "") : "";
    const property_address = addressEl ? (addressEl.value ? addressEl.value.trim() : "") : "";
    if (!name || !email) {
      return showMessage(statusDivId, "Name and email are required", "error");
    }
    if (!isValidEmail(email)) {
      return showMessage(statusDivId, "Please enter a valid email address", "error");
    }
    try {
      const data = await fetchJSON(`${API_BASE}/api/waitlist`, {
        method: "POST",
        body: JSON.stringify({ name, email, service, phone, property_address }),
      });
      showMessage(statusDivId, `✅ Thanks, ${name}! You're on our waitlist.`, "success", 0);
      form.reset();
    } catch (err) {
      showMessage(statusDivId, `✗ Submission failed: ${err.message}`, "error");
    }
  }

  // If an inline onsubmit handler exists (legacy), prefer that to avoid duplicate submits
  if (!form.getAttribute('onsubmit')) {
    form.addEventListener('submit', handleWaitlist);
  }
}

// ========================================
// Dashboard (dashboard.html)
// ========================================

if (document.getElementById("dashboard")) {
  const leadsContainer = document.getElementById("leads-list");
  const outboxContainer = document.getElementById("outbox-list");
  let pollTimer = null;

  function updateStats(data) {
    const leads = data.leads || [];
    const events = data.pending || [];
    const photos = events.filter(
      (e) => e.payload && e.payload.photo_path
    ).length;
    animateCounter("stat-leads", leads.length);
    animateCounter("stat-events", events.length);
    animateCounter("stat-photos", photos);
  }

  function renderLeads(leads) {
    if (leads.length === 0) {
      leadsContainer.innerHTML =
        '<div class="empty-state"><p class="text-muted">💼 No applications yet. <a href="/">Share careers page</a>.</p></div>';
      return;
    }

    const sorted = [...leads].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    const careerApps = sorted.filter((l) => l.source === "careers");
    const otherLeads = sorted.filter((l) => l.source !== "careers");

    let html = "";
    if (careerApps.length > 0) {
      html +=
        '<h3 class="mb-sm">💼 Worker Applications (' +
        careerApps.length +
        ")</h3>";
      html += careerApps
        .map(
          (lead) => `
        <div class="card"><div class="lead-card"><div class="lead-info">
          <h3>👤 ${escapeHTML(lead.name)}</h3>
          <div class="lead-meta">
            <span>📞 ${escapeHTML(lead.phone)}</span><span>•</span>
            <span>📧 <a href="mailto:${escapeHTML(lead.email)}">${escapeHTML(lead.email)}</a></span>
          </div>
          ${lead.notes ? `<p class="mt-sm"><strong>About:</strong> ${escapeHTML(lead.notes)}</p>` : ""}
          <p class="text-muted mt-sm"><small>🕒 Applied ${formatDate(lead.created_at)}</small></p>
        </div><div><span class="badge badge-primary">CAREERS</span></div></div></div>
      `
        )
        .join("");
    }
    if (otherLeads.length > 0) {
      html +=
        '<h3 class="mt-lg mb-sm">🎯 Other Inquiries (' +
        otherLeads.length +
        ")</h3>";
      html += otherLeads
        .map(
          (lead) => `
        <div class="card"><div class="lead-card"><div class="lead-info">
          <h3>👤 ${escapeHTML(lead.name)}</h3>
          <div class="lead-meta">
            <span>📞 ${escapeHTML(lead.phone)}</span><span>•</span>
            <span>📧 <a href="mailto:${escapeHTML(lead.email)}">${escapeHTML(lead.email)}</a></span>
          </div>
          ${lead.notes ? `<p class="mt-sm"><strong>Notes:</strong> ${escapeHTML(lead.notes)}</p>` : ""}
          <p class="text-muted mt-sm"><small>🕒 ${formatDate(lead.created_at)}</small></p>
        </div><div><span class="badge">${escapeHTML(lead.source || "web").toUpperCase()}</span></div></div></div>
      `
        )
        .join("");
    }
    leadsContainer.innerHTML = html;
  }

  function renderOutbox(events) {
    if (events.length === 0) {
      outboxContainer.innerHTML =
        '<div class="empty-state"><p class="text-muted">📋 No pending work queue items.</p></div>';
      return;
    }
    const grouped = events.reduce((acc, event) => {
      const type = event.type || "OTHER";
      if (!acc[type]) acc[type] = [];
      acc[type].push(event);
      return acc;
    }, {});
    let html = "";
    Object.entries(grouped).forEach(([type, typeEvents]) => {
      html += `<h3 class="mt-md mb-sm">${escapeHTML(type)} (${typeEvents.length})</h3>`;
      typeEvents.forEach((event) => {
        const hasPhoto = event.payload && event.payload.photo_path;
        const statusClass =
          event.status === "processed" ? "status-complete" : "status-pending";
        html += `<div class="card"><div class="card-header"><div><span class="status-indicator ${statusClass}"></span><strong>${escapeHTML(type)}</strong></div>${event.ref_id ? `<span class="badge">Job: ${escapeHTML(event.ref_id)}</span>` : ""}</div><div class="card-body">${hasPhoto ? `<div class="photo-grid"><div class="photo-item"><img src="${escapeHTML(event.payload.photo_path)}" alt="Job photo" loading="lazy" /></div></div>` : ""}${event.created_at ? `<p class="text-muted mt-sm"><small>🕒 ${formatDate(event.created_at)}</small></p>` : ""}</div></div>`;
      });
    });
    outboxContainer.innerHTML = html;
  }

  window.refreshDashboard = async function () {
    try {
      const data = await fetchJSON(`${API_BASE}/api/status`);
      updateStats(data);
      renderLeads(data.leads || []);
      renderOutbox(data.pending || []);
      clearMessage("dashboard-status");
    } catch (err) {
      console.error("[dashboard] Refresh error:", err);
      showMessage(
        "dashboard-status",
        `⚠ Unable to load data: ${err.message}. Retrying in 20 seconds...`,
        "error",
        0
      );
    }
  };

  refreshDashboard();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refreshDashboard, POLL_INTERVAL);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (pollTimer) clearInterval(pollTimer);
    } else {
      refreshDashboard();
      pollTimer = setInterval(refreshDashboard, POLL_INTERVAL);
    }
  });
}

// ========================================
// Photo Upload (dashboard.html)
// ========================================

if (document.getElementById("upload-form")) {
  const uploadForm = document.getElementById("upload-form");
  const fileInput = document.getElementById("photo-file");
  const preview = document.getElementById("photo-preview");
  const uploadBtn = document.getElementById("upload-btn");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      preview.innerHTML = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      showMessage("upload-status", "Please select an image file", "error");
      fileInput.value = "";
      preview.innerHTML = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showMessage(
        "upload-status",
        `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
        "error"
      );
      fileInput.value = "";
      preview.innerHTML = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      preview.innerHTML = `<div class="image-preview"><img src="${evt.target.result}" alt="Preview" /></div><p class="text-muted text-center mt-sm"><small>📎 ${escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} KB)</small></p>`;
    };
    reader.readAsDataURL(file);
    clearMessage("upload-status");
  });

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage("upload-status");
    const jobId = uploadForm.jobId.value.trim();
    const file = fileInput.files[0];
    if (!jobId)
      return showMessage("upload-status", "Job ID is required", "error");
    if (!file)
      return showMessage("upload-status", "Please select a photo", "error");

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner"></span> Uploading...';

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const data = await fetchJSON(
        `${API_BASE}/api/jobs/${encodeURIComponent(jobId)}/photo`,
        {
          method: "POST",
          body: JSON.stringify({ dataUrl }),
        }
      );
      showMessage(
        "upload-status",
        `✓ Photo uploaded!<br><small>Path: ${escapeHTML(data.path)}</small>`,
        "success",
        0
      );
      uploadForm.reset();
      preview.innerHTML = "";
      if (typeof refreshDashboard === "function")
        setTimeout(refreshDashboard, 1000);
    } catch (err) {
      showMessage("upload-status", `✗ Upload failed: ${err.message}`, "error");
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "📤 Upload Photo";
    }
  });
}

// ========================================
// Service Worker (PWA)
// ========================================

if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => console.log("[SW] Registered:", reg.scope))
      .catch((err) => console.warn("[SW] Failed:", err));
  });
}

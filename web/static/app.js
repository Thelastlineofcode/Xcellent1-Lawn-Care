// deno-lint-ignore-file no-inner-declarations no-unused-vars require-await no-explicit-any no-import-prefix no-redeclare adjacent-overload-signatures
// Minimal frontend behavior for lead form and dashboard
(() => {
  // Helper: show status
  function setStatus(id, msg, isError) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? "crimson" : "";
  }

  // Lead form submission
  const leadForm = document.getElementById("lead-form");
  if (leadForm) {
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("form-status", "Submitting...");
      const fd = new FormData(leadForm);
      const body = {};
      fd.forEach((v, k) => (body[k] = v));
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        const j = await res.json();
        if (j.ok) {
          setStatus("form-status", "Lead submitted — thank you!");
          leadForm.reset();
        } else {
          setStatus("form-status", "Error: " + (j.error || "unknown"), true);
        }
      } catch (err) {
        setStatus("form-status", "Network error", true);
      }
    });
  }

  // Dashboard: auto-refresh status
  async function refreshDashboard() {
    const statusEl = document.getElementById("dashboard-status");
    try {
      const res = await fetch("/api/status");
      const j = await res.json();
      if (!j.ok) {
        if (statusEl) statusEl.textContent = "Error fetching status";
        return;
      }
      const leads = j.leads || [];
      const pending = j.pending || [];
      document.getElementById("stat-leads").textContent = "" + leads.length;
      document.getElementById("stat-events").textContent = "" + pending.length;
      // photos count derived from pending events containing JOB_PHOTO
      const photos = pending.filter((p) => p.type === "JOB_PHOTO").length || 0;
      document.getElementById("stat-photos").textContent = "" + photos;

      // render leads list
      const leadsList = document.getElementById("leads-list");
      if (leadsList) {
        leadsList.innerHTML = "";
        if (leads.length === 0) {
          leadsList.innerHTML = '<div class="card">No active leads</div>';
        } else {
          leads.forEach((l) => {
            const div = document.createElement("div");
            div.className = "card lead-card mb-md";
            div.innerHTML = `<div class="lead-info"><h3>${l.name || "—"}</h3><div class="lead-meta"><span>${l.phone || ""}</span><span>${l.email || ""}</span></div></div><div><button class="btn" data-lead-id="${l.id}">View</button></div>`;
            leadsList.appendChild(div);
          });
        }
      }

      // render outbox
      const outboxList = document.getElementById("outbox-list");
      if (outboxList) {
        outboxList.innerHTML = "";
        if (pending.length === 0)
          outboxList.innerHTML = '<div class="card">No pending events</div>';
        else
          pending.forEach((ev) => {
            const div = document.createElement("div");
            div.className = "card mb-md";
            div.innerHTML = `<strong>${ev.type}</strong><div class="text-muted">${JSON.stringify(ev.payload || {})}</div>`;
            outboxList.appendChild(div);
          });
      }
    } catch (err) {
      if (statusEl)
        statusEl.textContent = "Network error while fetching status";
    }
  }

  if (document.getElementById("dashboard")) {
    refreshDashboard();
    setInterval(refreshDashboard, 20000);
  }

  // Upload form handling (convert file to data URL and POST)
  const uploadForm = document.getElementById("upload-form");
  if (uploadForm) {
    const fileInput = document.getElementById("photo-file");
    const preview = document.getElementById("photo-preview");
    fileInput &&
      fileInput.addEventListener("change", (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.innerHTML = `<img src="${ev.target.result}" alt="preview">`;
        };
        reader.readAsDataURL(f);
      });

    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("upload-status", "Uploading...");
      const jobId = document.getElementById("jobId").value.trim();
      const f = fileInput.files && fileInput.files[0];
      if (!jobId || !f) {
        setStatus("upload-status", "Missing job id or photo", true);
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result;
        try {
          const res = await fetch(
            `/api/jobs/${encodeURIComponent(jobId)}/photo`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dataUrl }),
            }
          );
          const j = await res.json();
          if (j.ok) {
            setStatus("upload-status", "Photo uploaded");
            uploadForm.reset();
            preview.innerHTML = "";
          } else
            setStatus(
              "upload-status",
              "Upload error: " + (j.error || "unknown"),
              true
            );
        } catch (err) {
          setStatus("upload-status", "Network error", true);
        }
      };
      reader.readAsDataURL(f);
    });
  }
})();
// Shared API utilities and frontend logic for Xcellent1 Lawn Care
// Field service dashboard with real-time KPIs and photo management

const API_BASE = "";
const POLL_INTERVAL = 20000; // 20 seconds
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ========================================
// Helper Functions
// ========================================

/**
 * Fetch JSON with error handling and loading states
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} JSON response
 */
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

/**
 * Show temporary message to user
 * @param {string} containerId - DOM element ID
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 * @param {number} duration - Auto-hide duration in ms (0 = no auto-hide)
 */
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

/**
 * Clear message from container
 * @param {string} containerId - DOM element ID
 */
function clearMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = "";
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Valid email
 */
function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

/**
 * Format date/time for display (relative or absolute)
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} Formatted date
 */
function formatDate(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  // Show relative time if < 24 hours
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h ago`;
  }

  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Animate number counter
 * @param {string} elementId - Element ID
 * @param {number} target - Target number
 */
function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const current = parseInt(el.textContent) || 0;
  const increment = Math.ceil((target - current) / 10);

  if (current === target) return;

  let count = current;
  const timer = setInterval(() => {
    count += increment;
    if (count >= target) {
      count = target;
      clearInterval(timer);
    }
    el.textContent = count;
  }, 30);
}

// ========================================
// Lead Form (index.html)
// ========================================

if (document.getElementById("lead-form")) {
  const form = document.getElementById("lead-form");
  const submitBtn = document.getElementById("submit-btn");
  const statusDiv = document.getElementById("form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage("form-status");

    // Get form values
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const notes = form.notes.value.trim();

    // Client-side validation
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

    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
      const data = await fetchJSON(`${API_BASE}/api/leads`, {
        method: "POST",
        body: JSON.stringify({
          name,
          phone,
          email,
          notes,
          source: "web",
        }),
      });

      showMessage(
        "form-status",
        `✓ Success! Your request has been received. Reference ID: <strong>${data.id}</strong><br><small>We'll contact you within 24 hours.</small>`,
        "success",
        0
      );

      // Reset form
      form.reset();

      // Scroll to message
      statusDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      showMessage(
        "form-status",
        `✗ Error: ${err.message}. Please try again or call us directly.`,
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Lead";
    }
  });

  // Real-time validation feedback
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

// ========================================
// Dashboard Status & Polling (dashboard.html)
// ========================================

if (document.getElementById("dashboard")) {
  const leadsContainer = document.getElementById("leads-list");
  const outboxContainer = document.getElementById("outbox-list");
  const dashboardStatus = document.getElementById("dashboard-status");
  let pollTimer = null;

  /**
   * Update KPI stats
   * @param {object} data - Dashboard data
   */
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

  /**
   * Fetch and render dashboard data
   */
  async function refreshDashboard() {
    try {
      const data = await fetchJSON(`${API_BASE}/api/status`);

      // Update KPIs
      updateStats(data);

      // Render leads
      renderLeads(data.leads || []);

      // Render outbox events
      renderOutbox(data.pending || []);

      // Clear any error messages
      clearMessage("dashboard-status");
    } catch (err) {
      console.error("[dashboard] Refresh error:", err);
      showMessage(
        "dashboard-status",
        `⚠ Failed to load data: ${err.message}. Retrying in 20 seconds...`,
        "error",
        0
      );
    }
  }

  /**
   * Render leads list with modern lawn care CRM styling
   * @param {Array} leads - Array of lead objects
   */
  function renderLeads(leads) {
    if (leads.length === 0) {
      leadsContainer.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">🎯 No active leads. <a href="/static/index.html">Create the first lead</a>.</p>
        </div>
      `;
      return;
    }

    // Sort by most recent first
    const sorted = [...leads].sort((a, b) => {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    leadsContainer.innerHTML = sorted
      .map(
        (lead) => `
      <div class="card">
        <div class="lead-card">
          <div class="lead-info">
            <h3>👤 ${escapeHTML(lead.name)}</h3>
            <div class="lead-meta">
              <span>📞 ${escapeHTML(lead.phone)}</span>
              <span>•</span>
              <span>📧 <a href="mailto:${escapeHTML(lead.email)}">${escapeHTML(lead.email)}</a></span>
            </div>
            ${lead.notes ? `<p class="mt-sm"><strong>Notes:</strong> ${escapeHTML(lead.notes)}</p>` : ""}
            <p class="text-muted mt-sm"><small>🕒 ${formatDate(lead.created_at)}</small></p>
          </div>
          <div>
            <span class="badge badge-primary">${escapeHTML(lead.source || "web").toUpperCase()}</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Render outbox events with photo thumbnails
   * @param {Array} events - Array of event objects
   */
  function renderOutbox(events) {
    if (events.length === 0) {
      outboxContainer.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">📋 No pending work queue items.</p>
        </div>
      `;
      return;
    }

    // Group events by type
    const grouped = events.reduce((acc, event) => {
      const type = event.type || "OTHER";
      if (!acc[type]) acc[type] = [];
      acc[type].push(event);
      return acc;
    }, {});

    // Render grouped events
    let html = "";
    Object.entries(grouped).forEach(([type, typeEvents]) => {
      html += `<h3 class="mt-md mb-sm">${escapeHTML(type)} (${typeEvents.length})</h3>`;

      typeEvents.forEach((event) => {
        const hasPhoto = event.payload && event.payload.photo_path;
        const statusClass =
          event.status === "processed" ? "status-complete" : "status-pending";

        html += `
          <div class="card">
            <div class="card-header">
              <div>
                <span class="status-indicator ${statusClass}"></span>
                <strong>${escapeHTML(type)}</strong>
              </div>
              ${event.ref_id ? `<span class="badge">Job: ${escapeHTML(event.ref_id)}</span>` : ""}
            </div>
            <div class="card-body">
              ${
                hasPhoto
                  ? `
                <div class="photo-grid">
                  <div class="photo-item">
                    <img src="${escapeHTML(event.payload.photo_path)}" alt="Job photo" loading="lazy" />
                  </div>
                </div>
              `
                  : ""
              }
              ${event.created_at ? `<p class="text-muted mt-sm"><small>🕒 ${formatDate(event.created_at)}</small></p>` : ""}
            </div>
          </div>
        `;
      });
    });

    outboxContainer.innerHTML = html;
  }

  /**
   * Update KPI stats with animation
   * @param {object} data - Dashboard data
   */
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

  /**
   * Start polling for dashboard updates
   */
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshDashboard, POLL_INTERVAL);
  }

  /**
   * Stop polling
   */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  /**
   * Fetch and render dashboard data (exposed for photo upload)
   */
  globalThis.refreshDashboard = async function () {
    try {
      const data = await fetchJSON(`${API_BASE}/api/status`);

      // Update KPIs
      updateStats(data);

      // Render leads
      renderLeads(data.leads || []);

      // Render outbox events
      renderOutbox(data.pending || []);

      // Clear any error messages
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

  // Initial load
  refreshDashboard();
  startPolling();

  // Stop polling when page is hidden (battery optimization)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopPolling();
    } else {
      refreshDashboard();
      startPolling();
    }
  });

  // Cleanup on page unload
  globalThis.addEventListener("beforeunload", stopPolling);
}

// ========================================
// Photo Upload (dashboard.html)
// ========================================

if (document.getElementById("upload-form")) {
  const uploadForm = document.getElementById("upload-form");
  const fileInput = document.getElementById("photo-file");
  const preview = document.getElementById("photo-preview");
  const uploadBtn = document.getElementById("upload-btn");
  const uploadStatus = document.getElementById("upload-status");

  /**
   * Handle file selection and preview
   */
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      preview.innerHTML = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage(
        "upload-status",
        "Please select an image file (JPEG, PNG, etc.)",
        "error"
      );
      fileInput.value = "";
      preview.innerHTML = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showMessage(
        "upload-status",
        `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`,
        "error"
      );
      fileInput.value = "";
      preview.innerHTML = "";
      return;
    }

    // Generate preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      preview.innerHTML = `
        <div class="image-preview">
          <img src="${evt.target.result}" alt="Photo preview" />
        </div>
        <p class="text-muted text-center mt-sm">
          <small>📎 ${escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} KB)</small>
        </p>
      `;
    };
    reader.readAsDataURL(file);

    clearMessage("upload-status");
  });

  /**
   * Handle photo upload form submission
   */
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage("upload-status");

    const jobId = uploadForm.jobId.value.trim();
    const file = fileInput.files[0];

    // Validation
    if (!jobId) {
      return showMessage("upload-status", "Job ID is required", "error");
    }

    if (!file) {
      return showMessage(
        "upload-status",
        "Please select a photo to upload",
        "error"
      );
    }

    // Disable upload button
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner"></span> Uploading...';

    try {
      // Read file as data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      // Upload to server
      const data = await fetchJSON(
        `${API_BASE}/api/jobs/${encodeURIComponent(jobId)}/photo`,
        {
          method: "POST",
          body: JSON.stringify({ dataUrl }),
        }
      );

      showMessage(
        "upload-status",
        `✓ Photo uploaded successfully!<br><small>Path: ${escapeHTML(data.path)}</small>`,
        "success",
        0
      );

      // Reset form and preview
      uploadForm.reset();
      preview.innerHTML = "";

      // Refresh dashboard to show new thumbnail
      if (typeof refreshDashboard === "function") {
        setTimeout(refreshDashboard, 1000);
      }
    } catch (err) {
      showMessage(
        "upload-status",
        `✗ Upload failed: ${err.message}. Please try again.`,
        "error"
      );
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "📤 Upload Photo";
    }
  });
}

// ========================================
// Utility: Animate Number Counter
// ========================================

/**
 * Animate number counter for KPIs
 * @param {string} elementId - Element ID
 * @param {number} target - Target number
 */
function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const increment = target > current ? 1 : -1;
  const steps = Math.abs(target - current);
  const duration = Math.min(steps * 50, 500); // Max 500ms
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
// Service Worker Registration (PWA)
// ========================================

if ("serviceWorker" in navigator && location.protocol === "https:") {
  globalThis.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/static/sw.js")
      .then((reg) => console.log("[SW] Registered:", reg.scope))
      .catch((err) => console.warn("[SW] Registration failed:", err));
  });
}

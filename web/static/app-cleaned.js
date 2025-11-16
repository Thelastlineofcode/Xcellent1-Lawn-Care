// Xcellent1 Lawn Care - Worker Recruitment & Field Management
// Designed for hiring lawn care workers and managing field operations
// VERSION: 2.0 - Cleaned and improved

const API_BASE = "";
const CONFIG = {
  pollInterval:
    window.config?.pollInterval ||
    parseInt(document.body.dataset.pollInterval || "20000"),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  validation: {
    nameMinLength: 2,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Improved regex
    phoneMinLength: 7,
  },
  csrfTokenSelector: 'input[name="csrf_token"]',
};

let pollTimer = null;

// ========================================
// UTILITIES
// ========================================

/**
 * Fetch JSON with proper error handling
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function fetchJSON(url, options = {}) {
  try {
    // Include CSRF token if present
    const csrfToken = document.querySelector(CONFIG.csrfTokenSelector);
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (
      csrfToken &&
      (options.method === "POST" ||
        options.method === "PUT" ||
        options.method === "DELETE")
    ) {
      headers["X-CSRF-Token"] = csrfToken.value;
    }

    const res = await fetch(url, {
      ...options,
      headers,
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
 * Show message with auto-hide
 * @param {string} containerId - Target element ID
 * @param {string} message - Message text (HTML allowed)
 * @param {string} type - Message type: 'info', 'success', 'error', 'warning'
 * @param {number} duration - Auto-hide after ms (0 = no auto-hide)
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
 * Clear messages
 * @param {string} containerId - Target element ID
 */
function clearMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = "";
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  return CONFIG.validation.emailPattern.test(email);
}

/**
 * Debounce function for input events
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {function}
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format date as relative time (e.g., "5m ago")
 * @param {string} isoString - ISO date string
 * @returns {string}
 */
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

/**
 * Escape HTML special characters for safe rendering
 * @param {string} str - String to escape
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Animate counter with smooth increment/decrement
 * @param {string} elementId - Element ID containing number
 * @param {number} target - Target number
 */
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
// WAITLIST FORM (home.html)
// ========================================

if (document.getElementById("lead-form")) {
  const form = document.getElementById("lead-form");
  const submitBtn = document.getElementById("submit-btn");
  const statusDiv = document.getElementById("form-status");
  let submitTimeout = null;

  /**
   * Validate and show next step
   * @param {number} step - Target step (1, 2, or 3)
   */
  window.showWaitlistStep = function (step) {
    // Validate current step before advancing
    if (step > 1) {
      const nameField = form.name;
      if (!nameField.value.trim() || nameField.value.trim().length < 2) {
        showMessage(
          "form-status",
          "⚠️ Please enter your full name (at least 2 characters)",
          "warning",
          3000
        );
        return;
      }
    }
    if (step > 2) {
      const emailField = form.email;
      if (!emailField.value.trim() || !isValidEmail(emailField.value.trim())) {
        showMessage(
          "form-status",
          "⚠️ Please enter a valid email address",
          "warning",
          3000
        );
        return;
      }
    }
    // Show the requested step
    for (let i = 1; i <= 3; i++) {
      const stepEl = document.getElementById(`waitlist-step-${i}`);
      if (stepEl) {
        stepEl.style.display = i === step ? "" : "none";
      }
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage("form-status");

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const notes = form.notes.value.trim();

    // Validation
    if (name.length < CONFIG.validation.nameMinLength) {
      return showMessage(
        "form-status",
        `⚠️ Name must be at least ${CONFIG.validation.nameMinLength} characters`,
        "error"
      );
    }
    if (!phone || phone.length < CONFIG.validation.phoneMinLength) {
      return showMessage(
        "form-status",
        "⚠️ Please enter a valid phone number",
        "error"
      );
    }
    if (!email || !isValidEmail(email)) {
      return showMessage(
        "form-status",
        "⚠️ Please enter a valid email address",
        "error"
      );
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner"></span> Submitting Application...';

    // Add timeout to prevent indefinite loading
    submitTimeout = setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "📨 Submit Application";
      showMessage(
        "form-status",
        "✗ Request timed out. Please try again.",
        "error"
      );
    }, 30000); // 30 second timeout

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

      clearTimeout(submitTimeout);
      showMessage(
        "form-status",
        `✓ <strong>Application Received!</strong><br><br>🎯 Application ID: <strong>${escapeHTML(data.id)}</strong><br><br>📞 <strong>What's Next?</strong><br>Our hiring manager will review your application and call you within <strong>48 hours</strong> to schedule an interview.<br><br>📧 Check your email (including spam folder) for confirmation.<br><br>👍 <strong>Pro Tip:</strong> Save our number so you don't miss the call!`,
        "success",
        0
      );

      form.reset();
      // Reset form visibility
      window.showWaitlistStep(1);
      statusDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      clearTimeout(submitTimeout);
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

  // Email validation on blur with debounce
  const validateEmail = debounce((email) => {
    if (email && !isValidEmail(email)) {
      form.email.setAttribute("aria-invalid", "true");
      showMessage(
        "form-status",
        "⚠️ This email format looks invalid",
        "warning",
        3000
      );
    } else {
      form.email.removeAttribute("aria-invalid");
    }
  }, 500);

  form.email.addEventListener("blur", (e) => {
    validateEmail(e.target.value.trim());
  });
}

// ========================================
// DASHBOARD (dashboard.html)
// ========================================

if (document.getElementById("dashboard")) {
  const leadsContainer = document.getElementById("leads-list");
  const outboxContainer = document.getElementById("outbox-list");

  /**
   * Update statistics display
   * @param {object} data - Data from API
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
   * Render leads list
   * @param {array} leads - Array of lead objects
   */
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

  /**
   * Render outbox/pending work queue
   * @param {array} events - Array of event objects
   */
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

  /**
   * Refresh dashboard data from API
   */
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
        `⚠ Unable to load  ${err.message}. Retrying in ${CONFIG.pollInterval / 1000} seconds...`,
        "error",
        0
      );
    }
  };

  // Initial load
  refreshDashboard();

  // Setup polling with configurable interval
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refreshDashboard, CONFIG.pollInterval);

  // Stop polling when tab is hidden, resume when visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (pollTimer) clearInterval(pollTimer);
    } else {
      refreshDashboard();
      pollTimer = setInterval(refreshDashboard, CONFIG.pollInterval);
    }
  });
}

// ========================================
// FILE UPLOAD (dashboard.html)
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
      showMessage(
        "upload-status",
        "⚠️ Please select an image file (JPG, PNG, etc.)",
        "error"
      );
      fileInput.value = "";
      preview.innerHTML = "";
      return;
    }
    if (file.size > CONFIG.maxFileSize) {
      showMessage(
        "upload-status",
        `⚠️ File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${CONFIG.maxFileSize / 1024 / 1024}MB.`,
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
      return showMessage("upload-status", "⚠️ Job ID is required", "error");
    if (!file)
      return showMessage("upload-status", "⚠️ Please select a photo", "error");

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
// SERVICE WORKER REGISTRATION (PWA)
// ========================================

if ("serviceWorker" in navigator) {
  // Allow localhost for development, production uses HTTPS
  const shouldRegister =
    location.protocol === "https:" || location.hostname === "localhost";

  if (shouldRegister) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .then((reg) => console.log("[SW] Registered:", reg.scope))
        .catch((err) => console.warn("[SW] Failed:", err));
    });
  }
}

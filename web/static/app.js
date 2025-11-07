// Shared API utilities and frontend logic for Xcellent1 Lawn Care
// Designed to work with Supabase backend via server.ts endpoints

const API_BASE = '';
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
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    
    return data;
  } catch (err) {
    console.error('[fetchJSON] Error:', err);
    throw new Error(err.message || 'Network error occurred');
  }
}

/**
 * Show temporary message to user
 * @param {string} containerId - DOM element ID
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 * @param {number} duration - Auto-hide duration in ms (0 = no auto-hide)
 */
function showMessage(containerId, message, type = 'info', duration = 5000) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `<div class="message ${type}" role="alert">${message}</div>`;
  container.setAttribute('aria-live', 'polite');
  
  if (duration > 0) {
    setTimeout(() => {
      container.innerHTML = '';
    }, duration);
  }
}

/**
 * Clear message from container
 * @param {string} containerId - DOM element ID
 */
function clearMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
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
 * Format date/time for display
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} Formatted date
 */
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========================================
// Lead Form (index.html)
// ========================================

if (document.getElementById('lead-form')) {
  const form = document.getElementById('lead-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusDiv = document.getElementById('form-status');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage('form-status');
    
    // Get form values
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const notes = form.notes.value.trim();
    
    // Client-side validation
    if (name.length < 2) {
      return showMessage('form-status', 'Name must be at least 2 characters', 'error');
    }
    
    if (!phone) {
      return showMessage('form-status', 'Phone number is required', 'error');
    }
    
    if (!email || !isValidEmail(email)) {
      return showMessage('form-status', 'Please enter a valid email address', 'error');
    }
    
    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
    
    try {
      const data = await fetchJSON(`${API_BASE}/api/leads`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          email,
          notes,
          source: 'web'
        })
      });
      
      showMessage(
        'form-status',
        `✓ Success! Your lead has been submitted. Reference ID: ${data.id}`,
        'success',
        0
      );
      
      // Reset form
      form.reset();
      
      // Scroll to message
      statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      showMessage(
        'form-status',
        `✗ Error: ${err.message}. Please try again.`,
        'error'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Lead';
    }
  });
  
  // Real-time validation feedback
  form.email.addEventListener('blur', (e) => {
    const email = e.target.value.trim();
    if (email && !isValidEmail(email)) {
      e.target.setAttribute('aria-invalid', 'true');
      showMessage('form-status', 'Please enter a valid email address', 'warning', 3000);
    } else {
      e.target.removeAttribute('aria-invalid');
    }
  });
}

// ========================================
// Dashboard Status & Polling (dashboard.html)
// ========================================

if (document.getElementById('dashboard')) {
  const leadsContainer = document.getElementById('leads-list');
  const outboxContainer = document.getElementById('outbox-list');
  const dashboardStatus = document.getElementById('dashboard-status');
  let pollTimer = null;
  
  /**
   * Fetch and render dashboard data
   */
  async function refreshDashboard() {
    try {
      const data = await fetchJSON(`${API_BASE}/api/status`);
      
      // Render leads
      renderLeads(data.leads || []);
      
      // Render outbox events
      renderOutbox(data.pending || []);
      
      // Clear any error messages
      clearMessage('dashboard-status');
    } catch (err) {
      console.error('[dashboard] Refresh error:', err);
      showMessage(
        'dashboard-status',
        `Failed to load data: ${err.message}`,
        'error',
        0
      );
    }
  }
  
  /**
   * Render leads list
   * @param {Array} leads - Array of lead objects
   */
  function renderLeads(leads) {
    if (leads.length === 0) {
      leadsContainer.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">No leads yet. Create your first lead from the <a href="/static/index.html">lead form</a>.</p>
        </div>
      `;
      return;
    }
    
    leadsContainer.innerHTML = leads.map(lead => `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${escapeHTML(lead.name)}</h3>
          <span class="badge badge-primary">${escapeHTML(lead.source || 'web')}</span>
        </div>
        <div class="card-body">
          <p><strong>Phone:</strong> ${escapeHTML(lead.phone)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHTML(lead.email)}">${escapeHTML(lead.email)}</a></p>
          ${lead.notes ? `<p><strong>Notes:</strong> ${escapeHTML(lead.notes)}</p>` : ''}
          ${lead.created_at ? `<p class="text-muted"><small>Created: ${formatDate(lead.created_at)}</small></p>` : ''}
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Render outbox events
   * @param {Array} events - Array of event objects
   */
  function renderOutbox(events) {
    if (events.length === 0) {
      outboxContainer.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">No pending events.</p>
        </div>
      `;
      return;
    }
    
    outboxContainer.innerHTML = events.map(event => {
      const hasPhoto = event.payload && event.payload.photo_path;
      
      return `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${escapeHTML(event.type)}</h3>
            ${event.ref_id ? `<span class="badge">Ref: ${escapeHTML(event.ref_id)}</span>` : ''}
          </div>
          <div class="card-body">
            ${hasPhoto ? `
              <div class="image-preview">
                <img src="${escapeHTML(event.payload.photo_path)}" alt="Job photo" loading="lazy" />
              </div>
            ` : ''}
            ${event.created_at ? `<p class="text-muted"><small>Created: ${formatDate(event.created_at)}</small></p>` : ''}
          </div>
        </div>
      `;
    }).join('');
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
  
  // Initial load
  refreshDashboard();
  startPolling();
  
  // Stop polling when page is hidden (battery optimization)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPolling();
    } else {
      refreshDashboard();
      startPolling();
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', stopPolling);
}

// ========================================
// Photo Upload (dashboard.html)
// ========================================

if (document.getElementById('upload-form')) {
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('photo-file');
  const preview = document.getElementById('photo-preview');
  const uploadBtn = document.getElementById('upload-btn');
  const uploadStatus = document.getElementById('upload-status');
  
  /**
   * Handle file selection and preview
   */
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      preview.innerHTML = '';
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('upload-status', 'Please select an image file', 'error');
      fileInput.value = '';
      preview.innerHTML = '';
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showMessage(
        'upload-status',
        `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`,
        'error'
      );
      fileInput.value = '';
      preview.innerHTML = '';
      return;
    }
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      preview.innerHTML = `
        <div class="image-preview">
          <img src="${evt.target.result}" alt="Photo preview" />
        </div>
        <p class="text-muted text-center"><small>${file.name} (${(file.size / 1024).toFixed(1)} KB)</small></p>
      `;
    };
    reader.readAsDataURL(file);
    
    clearMessage('upload-status');
  });
  
  /**
   * Handle photo upload form submission
   */
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage('upload-status');
    
    const jobId = uploadForm.jobId.value.trim();
    const file = fileInput.files[0];
    
    // Validation
    if (!jobId) {
      return showMessage('upload-status', 'Job ID is required', 'error');
    }
    
    if (!file) {
      return showMessage('upload-status', 'Please select a photo to upload', 'error');
    }
    
    // Disable upload button
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner"></span> Uploading...';
    
    try {
      // Read file as data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      // Upload to server
      const data = await fetchJSON(`${API_BASE}/api/jobs/${encodeURIComponent(jobId)}/photo`, {
        method: 'POST',
        body: JSON.stringify({ dataUrl })
      });
      
      showMessage(
        'upload-status',
        `✓ Photo uploaded successfully! Path: ${data.path}`,
        'success',
        0
      );
      
      // Reset form and preview
      uploadForm.reset();
      preview.innerHTML = '';
      
      // Refresh dashboard to show new thumbnail
      if (typeof refreshDashboard === 'function') {
        setTimeout(refreshDashboard, 1000);
      }
    } catch (err) {
      showMessage(
        'upload-status',
        `✗ Upload failed: ${err.message}`,
        'error'
      );
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Photo';
    }
  });
}

// ========================================
// Service Worker Registration (PWA)
// ========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

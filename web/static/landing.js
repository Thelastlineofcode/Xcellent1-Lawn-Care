// Landing page UI script - handles lead form submission via fetch
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const statusEl = document.createElement('div');
  statusEl.id = 'lead-status';
  statusEl.style.marginTop = '8px';
  form.appendChild(statusEl);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.querySelector('#name').value.trim();
    const phone = form.querySelector('#phone').value.trim();
    const email = form.querySelector('#email').value.trim();

    if (!name || !phone || !email) {
      statusEl.textContent = 'Please complete all fields.';
      statusEl.style.color = 'red';
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    statusEl.textContent = 'Submitting...';
    statusEl.style.color = 'inherit';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email }),
      });

      const json = await res.json();
      if (res.status === 201 && json.ok) {
        statusEl.textContent = 'Thanks! You are on the waitlist 🚀';
        statusEl.style.color = 'green';
        form.reset();
      } else {
        statusEl.textContent = json.error || 'An error occurred.';
        statusEl.style.color = 'red';
      }
    } catch (err) {
      statusEl.textContent = 'Network error, try again.';
      statusEl.style.color = 'red';
    } finally {
      btn.disabled = false;
    }
  });
});

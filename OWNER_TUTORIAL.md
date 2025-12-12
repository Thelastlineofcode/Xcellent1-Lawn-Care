# Owner System Tutorial - Xcellent1 Lawn Care

Welcome to the Xcellent1 Lawn Care Owner Dashboard! This guide covers how to use the system to manage your clients, invoices, and business metrics.

## 1. Accessing the Dashboard

**Login**: Go to `/static/login.html` and sign in with your owner credentials (email and password).
**Direct Link**: [/static/owner.html](/static/owner.html)

Once logged in, you will see the **Business Dashboard**, which gives you a quick snapshot of your company's health:
- **KPI Cards**: Revenue, Active Crew, Jobs this Week, New Applications.
- **Quick Actions**: One-click buttons to common tasks.
- **Financial Summary**: Recent profit margins and outstanding invoices.

---

## 2. Managing Clients

The core of your business operations.

### How to Add a New Client
1. Click **Manage Clients** or go to the **Clients** tab in the navigation bar.
2. Click the **➕ Add Client** button in the toolbar.
3. Fill in the required details:
   - **Client Info**: Name, Email (required for invoicing), Phone.
   - **Property Info**: Service Address, City, State, Zip, and default Service Plan (e.g., Weekly).
4. Click **Save Client**.

### Viewing & Editing Clients
- **Search**: Use the search bar to find clients by name or address.
- **Filter**: Use the dropdown to show only "Active", "Paused", or "Cancelled" clients.
- **Details**: Click on any row in the table to view the full **Client Profile**.
  - See their job history, upcoming schedule, and invoice history all in one place.
- **Edit**: From the Client Profile, click **Edit Client** to update their info or change their status.

---

## 3. Invoicing & Payments

Manage billing and track revenue.

### How to Create an Invoice
1. Go to the **Invoices** tab.
2. Click **+ New Invoice**.
3. **Select Client**: Choose the client from the dropdown menu.
4. **Dates**: Set the Invoice Date and Due Date (defaults to 30 days out).
5. **Add Line Items**:
   - Description (e.g., "Weekly Lawn Cut", "Mulch Installation").
   - Quantity and Price.
   - Click **+ Add Item** for multiple services.
6. **Notes**: Add any payment instructions or thank-you messages.
7. Click **Save Invoice**.

### Recording a Payment
When a client pays you (via Cash, Check, Venmo, etc.), you must record it manually in the system:
1. Go to the **Invoices** list.
2. Find the unpaid invoice and click the **Record Payment** button.
3. Enter the **Amount** paid.
4. Select the **Payment Method** (Cash, Check, Zelle, etc.).
5. (Optional) Add a **Transaction ID** for tracking.
6. Click **Record Payment**. The invoice status will update to `Paid`.

---

## 4. Other Features

### Crew Performance
The dashboard shows a live feed of crew activity:
- See who is active.
- Track completed jobs vs. scheduled jobs.
- Monitor job photos uploaded by the crew.

### Manage Applications (Hiring)
Review incoming job applications from the Careers page (`/careers.html`).

1. **View Applications**: Click **Manage Applications**.
2. **Review Candidates**: See applicant details, experience, and notes.
3. **Schedule Interview**: Click the **📅 Schedule Interview** button to email the candidate.
4. **Update Status**: 
   - Set status to **Interview** after scheduling.
   - Set status to **Hired** only after they accept the offer.

### Quote Calculator
On the main dashboard, use the **Quote Calculator** to quickly estimate pricing for new inquiries based on lawn size and service type.

---

## Support
If you encounter any issues (e.g., "Database not connected"), the system has built-in fail-safes to keep working. If problems persist, please contact your technical administrator.

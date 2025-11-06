# Agents → Staff: Xcellent1 Lawn Care

Prepared for: The Last Line of Code
Language: English
Generated: 2025-11-06

Heroic dispatch — converting the automated agents in the architecture into real-world staff roles, hiring priorities, and operational SOPs so Xcellent1 can run smoothly whether automation is present or not.

1.  Executive summary

- Goal: Map each stateless agent described in the architecture (intake, quote, scheduler, billing, digest, review inviter, outbox worker) to human roles with responsibilities, required skills, KPIs, and initial headcount recommendations for small and medium scale operations.
- Outcome: A practical staff plan that can be used for hiring, role assignments, or temporary/manual fallbacks while automation is developed.

2.  Mapping: Agent → Staff Role (overview)

1)  Agent: Intake / Lead Intake Agent
    - Staff role: Customer Intake Specialist (or Lead Specialist)
    - Responsibilities:
      a. Monitor inbound SMS, PWA lead form submissions, and phone calls.
      b. Qualify leads (service type, address, lawn size, urgency), capture data into CRM (Supabase), and escalate to Scheduler when ready.
      c. Provide basic pricing estimates using pricing heuristics; capture photos if provided.
      d. Follow scripts for replies, collect contact permission, and tag leads (residential, commercial, HOA).
    - Required skills: strong written communication (SMS/email), basic Excel/CSV, CRM data entry, attention to detail, familiarity with service pricing heuristics.
    - KPIs: lead response time (<15 min), lead conversion rate, data completeness rate, lead handling accuracy.
    - Hiring priority: P0 (first hires for customer-facing growth)
    - FTE estimate: Small: 0.5–1 (part-time + shared tasks) ; Medium: 1–2

2)  Agent: Quote/Estimate Agent
    - Staff role: Pricing & Estimating Coordinator
    - Responsibilities:
      a. Use the pricing helper to produce quick estimates and two-slot scheduling suggestions.
      b. Handle edge cases where automated heuristics fail (irregular lot, gated access, multi-property accounts).
      c. Approve or adjust quotes produced by automation; maintain pricing notes and seasonal adjustments.
    - Required skills: basic math, knowledge of services and time estimates, attention to site characteristics.
    - KPIs: quote accuracy, time-to-quote, quote-to-job conversion.
    - Hiring priority: P1
    - FTE estimate: Small: 0.2–0.5 ; Medium: 0.5–1

3)  Agent: Scheduler / Dispatch Agent
    - Staff role: Scheduler / Dispatch Coordinator
    - Responsibilities:
      a. Convert accepted quotes into scheduled jobs, assign crews, confirm time windows with customers.
      b. Monitor daily schedule, reassign jobs for crew availability, track weather exceptions and delays.
      c. Create daily routes when optimization isn't yet automated; coordinate with Crew Leads.
    - Required skills: calendar scheduling, routing basics, strong communication with field crew, decision-making under constraints.
    - KPIs: on-time starts, schedule adherence, cancellations handled, utilization rate.
    - Hiring priority: P0
    - FTE estimate: Small: 0.5–1 ; Medium: 1–2

4)  Agent: Field Crew / Job Completion Agent
    - Staff role: Crew Lead / Field Supervisor
    - Responsibilities:
      a. Execute jobs, upload before/after photos, mark job complete, confirm durations and notes.
      b. Ensure quality, safety, and client satisfaction; escalate issues to Operations Manager.
      c. Collect onsite signatures or approvals when required.
    - Required skills: hands-on lawn care experience, leadership, basic smartphone tooling for PWA/photo upload.
    - KPIs: job completion accuracy, photo quality, job duration variance, customer rating.
    - Hiring priority: P0 (core ops)
    - FTE estimate: per crew (3–5 techs per crew + 1 lead). For planning, assume 1 crew lead per 3–5 techs.

5)  Agent: Invoicing & Payments Agent
    - Staff role: Billing & Payments Specialist
    - Responsibilities:
      a. Create invoices from completed jobs, issue Stripe paylinks, follow-up on failed payments.
      b. Reconcile payments and update records in Supabase; escalate chargebacks or disputes.
      c. Run monthly MTD/MT forecasts and reports for owner.
    - Required skills: bookkeeping fundamentals, Stripe familiarity, attention to detail.
    - KPIs: DSO (days sales outstanding), invoice accuracy, collection rate.
    - Hiring priority: P0
    - FTE estimate: Small: 0.2–0.5 ; Medium: 0.5–1

6)  Agent: Outbox Worker / Notification Dispatcher
    - Staff role: Communications & Notifications Coordinator
    - Responsibilities:
      a. Send appointment reminders, invoice emails/SMS, and owner alerts via SendGrid/Twilio (or confirm delivery when automation stalled).
      b. Monitor delivery failures and retry logic; keep a log of undelivered messages and escalate persistent issues.
      c. Maintain templates and test sends.
    - Required skills: templated-email/sms editing, familiarity with SendGrid/Twilio dashboards, troubleshooting.
    - KPIs: delivery success rate, open/click rates for owner digests, reminder-no-show rates.
    - Hiring priority: P1 (can be combined with Intake role initially)
    - FTE estimate: Small: 0.2 (shared) ; Medium: 0.5–1

7)  Agent: Owner Weekly Digest Agent
    - Staff role: Operations Analyst / Owner Liaison
    - Responsibilities:
      a. Aggregate KPIs for weekly digest (revenue_week, revenue_mtd, jobs_completed, complaints, reviews_new, alerts).
      b. Verify KPI calculations, annotate anomalies, and publish digest to owner via email/SMS.
      c. Maintain dashboards (owner-updates-dashboard) and respond to owner follow-ups.
    - Required skills: SQL/BI basics, Excel, dashboarding (Supabase queries, Google Sheets), clear written summaries.
    - KPIs: digest timeliness, metric accuracy, owner satisfaction.
    - Hiring priority: P1
    - FTE estimate: Small: 0.1–0.2 (can be founder/owner delivered) ; Medium: 0.5

8)  Agent: Review Invite Agent
    - Staff role: Customer Experience / Review Coordinator
    - Responsibilities:
      a. After invoice paid, reach out to customers to request reviews via SMS/email.
      b. Monitor review platforms, aggregate ratings, and respond to negative feedback or escalate.
    - Required skills: customer outreach, reputation management, copywriting.
    - KPIs: review conversion rate, average rating, negative response resolution time.
    - Hiring priority: P2
    - FTE estimate: Small: 0.1 (part-time) ; Medium: 0.2–0.5

9)  Agent: Agent Orchestration / Platform Agent
    - Staff role: Platform Engineer / DevOps (Deno + Supabase)
    - Responsibilities:
      a. Build and maintain Deno Deploy services, cron jobs, webhook receivers, and the outbox worker.
      b. Maintain secrets, CI/CD (GitHub Actions), deployments, and monitor costs/usage.
      c. Implement idempotency, retries, and observability (Sentry, logs, correlation IDs).
    - Required skills: Deno/TypeScript, Supabase/Postgres, CI/CD, cloud/webhooks, monitoring.
    - KPIs: uptime, deployment lead time, mean time to recover (MTTR), cost per customer.
    - Hiring priority: P0
    - FTE estimate: Small: 0.2 (contractor) ; Medium: 0.5–1

10) Agent: Data & Analytics Agent
    - Staff role: Data Analyst
    - Responsibilities:
      a. Build reports, run ad-hoc analysis (revenue, route efficiency), and help refine pricing heuristics.
      b. Support owner weekly digest and long-term forecasting.
    - Required skills: SQL, basic stats, visualization (Metabase/Looker/Sheets).
    - KPIs: report accuracy, insights delivered per month.
    - Hiring priority: P2
    - FTE estimate: Small: 0 (owner does it) ; Medium: 0.2–0.5

3.  Suggested team structure and hiring roadmap (first 6 months)

- Phase A (MVP ops, 0–3 months): Hire Intake Specialist (part-time / shared), Scheduler (part-time), Crew Lead(s) via hires or contractors, and a Billing specialist (part-time). Use founder+contractor for Platform Engineer work.
- Phase B (scale, 3–12 months): Add full-time Scheduler/Dispatcher, another Crew Lead, Platform Engineer (0.5–1 FTE), Communications coordinator, and part-time Data Analyst.

4.  SOP snippets (copy into `docs/sops/` or your HR folder)

- Intake SOP (quick):
  1.  Monitor `inbox/lead-queue` in Supabase twice per 15 minutes during business hours.
  2.  Use the intake form script to confirm service_type, address, lawn_size estimate, and next available slots.
  3.  If quote heuristic ambiguous, mark "needs_pricing_review" and notify Pricing Coordinator.
  4.  Tag lead and send confirmation SMS with estimated response time.

- Completing a job (crew lead):
  1.  Upload before photos before starting job; take after photos and mark job complete in PWA.
  2.  Record duration_min and any deviations; if duration deviates >30% from estimate, file a short note.
  3.  If customer feedback negative, escalate to Operations Manager within 24 hours.

- Invoice follow-up (billing):
  1.  Issue Stripe paylink within 24 hours of invoice generation.
  2.  If not paid after 3 days, send reminder SMS; after 7 days, call or escalate to owner if >$500 outstanding.

5.  Tools & permissions matrix

- Supabase: Customers/Jobs/Invoices (BE+Platform Engineer + Billing + Intake have write access; Crew have limited upload access)
- Deno Deploy project: Platform Engineer only (service keys in secret manager)
- Stripe: Billing role (read/write for Billing Specialist; limited access for owner)
- SendGrid/Twilio: Communications coordinator (send + template edit); Platform Engineer for API keys
- Dashboard/Sheets: Owner + Ops + Data Analyst (read/write as needed)

6.  Quick fallback playbook (when automation is down)

- If automated intake fails: Intake Specialist monitors Twilio and manual PWA submissions. Use manual post to Supabase and notify Scheduler.
- If Stripe webhooks fail: Billing Specialist verify payment status in Stripe dashboard and reconcile manually.
- If outbox worker offline: Communications coordinator send critical owner alerts manually via email/SMS and log actions in Supabase.

7.  Hiring templates (job description bullets)

- Example: Customer Intake Specialist (PT)
  - Answer SMS and PWA leads, qualify customers, and create accurate lead records in CRM.
  - 15–25 hours/week; pay: competitive; reports to Operations Manager.

8.  Estimated monthly headcount & cost (ballpark)

- Small operations (≤100 customers): ~2–3 core staff equivalents (1 Intake/Scheduler hybrid, 1 Billing/Communications, 1 Platform contractor, crew technicians paid separately). Estimated monthly payroll: modest — depends on local rates.
- Medium operations (~250 customers): ~4–7 staff FTE (Scheduler, Intake, Billing, Platform 0.5–1, Communications, Data 0.2, 1–2 Ops). Plan budget accordingly.

9.  Next steps I can execute for you

1)  Generate individual job descriptions (expand any role into a full JD and interview checklist).
2)  Create `docs/sops/` files for each SOP snippet and add them to the repo.
3)  Wire basic permissions and a README mapping roles → Supabase groups (dev-only scaffolding).

Choose which of the next steps to run and I will start implementing it. If you want immediate hires prioritized, say: "prioritize hires: Intake, Scheduler, Platform" and I will mark them P0 and prepare job descriptions.

---

Generated by BMAD Builder persona for Xcellent1 Lawn Care.

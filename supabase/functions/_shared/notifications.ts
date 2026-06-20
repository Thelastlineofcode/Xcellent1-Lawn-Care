export interface NotificationEvent {
  type: string;
  payload: Record<string, unknown>;
  job_id?: string;
  lead_id?: string;
  invoice_id?: string;
  worker_id?: string;
}

export interface NotificationResult {
  sms_sent: boolean;
  email_sent: boolean;
  push_sent: boolean;
  errors: string[];
}

async function notificationAlreadyLogged(
  recipientType: "owner" | "crew" | "customer",
  channel: "sms" | "email" | "push",
  eventType: string,
  refId: string | undefined,
): Promise<boolean> {
  if (!refId) return false;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Can't dedupe without the log source of truth.
    return false;
  }

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/notifications_log`);
    url.searchParams.set("select", "id");
    url.searchParams.set("event_type", `eq.${eventType}`);
    url.searchParams.set("channel", `eq.${channel}`);
    url.searchParams.set("recipient_type", `eq.${recipientType}`);
    url.searchParams.set("ref_id", `eq.${refId}`);
    url.searchParams.set("status", "eq.sent");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch (err) {
    console.warn("notificationAlreadyLogged check failed:", err);
    return false;
  }
}

export async function shouldSendNotification(
  recipientType: "owner" | "crew" | "customer",
  channel: "sms" | "email" | "push",
  eventType: string,
  refId: string | undefined,
): Promise<boolean> {
  const already = await notificationAlreadyLogged(
    recipientType,
    channel,
    eventType,
    refId,
  );
  return !already;
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Twilio credentials not configured, skipping SMS");
    return false;
  }
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: to,
        Body: body,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Twilio SMS error:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Twilio SMS failed:", err);
    return false;
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
  const FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@xcellent1lawn.com";
  
  if (!SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured, skipping email");
    return false;
  }
  
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    
    if (response.status !== 202) {
      const error = await response.text();
      console.error("SendGrid email error:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("SendGrid email failed:", err);
    return false;
  }
}

export async function logNotification(
  recipientType: "owner" | "crew" | "customer",
  recipientId: string | undefined,
  channel: "sms" | "email" | "push",
  eventType: string,
  refId: string | undefined,
  payload: Record<string, unknown>,
  status: "sent" | "failed" | "bounced" = "sent"
): Promise<void> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase credentials not configured, skipping notification log");
    return;
  }
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications_log`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        recipient_type: recipientType,
        recipient_id: recipientId,
        channel,
        event_type: eventType,
        ref_id: refId,
        payload,
        status,
      }),
    });

    // If the DB has a unique index for dedupe, a duplicate insert can return 409.
    // In that case we intentionally ignore it.
    if (!(res.ok || res.status === 409)) {
      const text = await res.text().catch(() => "");
      console.warn("Notification log insert failed:", res.status, text);
    }
  } catch (err) {
    console.error("Failed to log notification:", err);
  }
}

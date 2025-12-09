// Email service for Xcellent1 Lawn Care
// Uses SendGrid or Deno email capabilities

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@xcellent1lawn.com";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try SendGrid first if API key is configured
    if (SENDGRID_API_KEY) {
      return await sendViaMailService(options);
    }

    // Fallback: log to console (for development)
    console.log("[email] Email service not configured, logging to console:");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${options.from || FROM_EMAIL}`);
    console.log("HTML:", options.html);

    return true;
  } catch (err) {
    console.error("[email] Error sending email:", err);
    return false;
  }
}

async function sendViaMailService(options: EmailOptions): Promise<boolean> {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [
            {
              email: options.to,
            },
          ],
        },
      ],
      from: {
        email: options.from || FROM_EMAIL,
        name: "Xcellent1 Lawn Care",
      },
      subject: options.subject,
      content: [
        {
          type: "text/html",
          value: options.html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[email] SendGrid error:", error);
    return false;
  }

  return true;
}

export function buildOwnerInvitationEmail(
  name: string,
  setupUrl: string,
  expiresAt: string
): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #f9f9f9;
    }
    .header {
      background: linear-gradient(135deg, #3b832a 0%, #2d6520 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #3b832a;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .expiry {
      background: #fffacd;
      border-left: 4px solid #ffa500;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Xcellent1 Lawn Care</h1>
      <p>Complete your account setup</p>
    </div>
    <div class="content">
      <p>Hi ${name},</p>

      <p>You've been invited to join Xcellent1 Lawn Care as an owner. Click the button below to complete your account setup:</p>

      <center>
        <a href="${setupUrl}" class="button">Complete Your Setup</a>
      </center>

      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 12px;">
        ${setupUrl}
      </p>

      <div class="expiry">
        <strong>⏰ This invitation expires on ${expiryDate}</strong>
        <p style="margin: 8px 0 0 0; font-size: 13px;">
          If you don't complete your setup by then, you'll need to request a new invitation.
        </p>
      </div>

      <h3>What happens next?</h3>
      <ol>
        <li>Click the button above</li>
        <li>Create a secure password</li>
        <li>Log in to your owner dashboard</li>
        <li>Start managing your business!</li>
      </ol>

      <p style="color: #666;">
        If you have any questions, please don't hesitate to contact us at
        <strong>info@xcellent1lawn.com</strong> or call
        <strong>(504) 875-8079</strong>
      </p>

      <p>
        Best regards,<br>
        <strong>The Xcellent1 Team</strong>
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Xcellent1 Lawn Care LLC. All rights reserved.</p>
      <p>If you did not request this invitation, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

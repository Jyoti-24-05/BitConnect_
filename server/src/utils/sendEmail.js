// server/src/utils/sendEmail.js
import nodemailer from "nodemailer";

// ─── Transporter factory ──────────────────────────────────────────────────────
// Called fresh each time — avoids stale connections
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === "465", // true for port 465, false for 587/2525
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// ─── Brand constants ──────────────────────────────────────────────────────────
const BRAND_COLOR  = "#4F46E5";
const BRAND_NAME   = "BitConnect";
const LOGO_URL     = `${process.env.CLIENT_URL}/logo.png`;

// ─── Base HTML wrapper — consistent styling across all emails ─────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:28px 40px;text-align:center">
              <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px">
                ${BRAND_NAME}
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 40px;text-align:center;
                       border-top:1px solid #E5E7EB">
              <p style="margin:0;color:#9CA3AF;font-size:12px">
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
              <p style="margin:6px 0 0;color:#9CA3AF;font-size:12px">
                BIT Mesra, Ranchi, Jharkhand
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── CTA button component ─────────────────────────────────────────────────────
const ctaButton = (text, url) => `
  <a href="${url}"
     style="display:inline-block;margin-top:24px;padding:14px 28px;
            background:${BRAND_COLOR};color:#ffffff;border-radius:8px;
            text-decoration:none;font-weight:600;font-size:15px">
    ${text}
  </a>`;

// ─── Email templates ──────────────────────────────────────────────────────────
const templates = {

  welcome: ({ username }) => ({
    subject: `Welcome to ${BRAND_NAME} 🎉`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:22px">
        Welcome aboard, ${username}!
      </h2>
      <p style="color:#6B7280;line-height:1.7;margin:0 0 12px">
        Your ${BRAND_NAME} account is ready. Start exploring events,
        joining clubs, and connecting with your college community.
      </p>
      <ul style="color:#6B7280;line-height:2;padding-left:20px">
        <li>Browse and RSVP to upcoming events</li>
        <li>Join student clubs and organizations</li>
        <li>Share posts, achievements, and opportunities</li>
        <li>Get real-time notifications</li>
      </ul>
      ${ctaButton("Explore BitConnect", `${process.env.CLIENT_URL}/feed`)}
      <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
        If you didn't create this account, you can safely ignore this email.
      </p>
    `),
  }),

  passwordReset: ({ username, resetURL }) => ({
    subject: `Reset your ${BRAND_NAME} password`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:22px">
        Password Reset Request
      </h2>
      <p style="color:#6B7280;line-height:1.7;margin:0 0 12px">
        Hi <strong>${username}</strong>, we received a request to reset
        your ${BRAND_NAME} password.
      </p>
      <p style="color:#6B7280;line-height:1.7;margin:0">
        Click the button below to set a new password.
        This link expires in <strong>15 minutes</strong>.
      </p>
      ${ctaButton("Reset My Password", resetURL)}
      <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
        If you didn't request a password reset, your account is safe —
        just ignore this email. Never share this link with anyone.
      </p>
    `),
  }),

  rsvpConfirmation: ({ username, eventTitle, eventDate, eventURL }) => ({
    subject: `RSVP confirmed: ${eventTitle} 🎟️`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:22px">
        You're going! 🎉
      </h2>
      <p style="color:#6B7280;line-height:1.7;margin:0 0 20px">
        Hi <strong>${username}</strong>, your RSVP for
        <strong>${eventTitle}</strong> is confirmed.
      </p>
      <table style="background:#F9FAFB;border-radius:8px;padding:20px;width:100%;
                    border:1px solid #E5E7EB" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#374151;font-weight:600;padding:6px 0">📅 Date & Time</td>
          <td style="color:#6B7280;padding:6px 0">
            ${new Date(eventDate).toLocaleString("en-IN", {
              timeZone:    "Asia/Kolkata",
              dateStyle:   "full",
              timeStyle:   "short",
            })}
          </td>
        </tr>
      </table>
      ${ctaButton("View Event Details", eventURL)}
      <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
        You can cancel your RSVP from the event page at any time.
      </p>
    `),
  }),

  eventReminder: ({ username, eventTitle, eventDate, eventURL }) => ({
    subject: `Reminder: "${eventTitle}" is tomorrow! ⏰`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:22px">
        Event Reminder 📅
      </h2>
      <p style="color:#6B7280;line-height:1.7;margin:0 0 16px">
        Hi <strong>${username}</strong>, just a heads-up —
        <strong>${eventTitle}</strong> is happening tomorrow.
      </p>
      <p style="color:#6B7280;margin:0">
        <strong>When:</strong>
        ${new Date(eventDate).toLocaleString("en-IN", {
          timeZone:  "Asia/Kolkata",
          dateStyle: "full",
          timeStyle: "short",
        })}
      </p>
      ${ctaButton("View Event", eventURL)}
    `),
  }),

  clubJoinApproved: ({ username, clubName, clubURL }) => ({
    subject: `You're now a member of ${clubName}! 🎊`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:22px">
        Join Request Approved!
      </h2>
      <p style="color:#6B7280;line-height:1.7;margin:0 0 16px">
        Hi <strong>${username}</strong>, your request to join
        <strong>${clubName}</strong> has been approved.
        You're officially a member!
      </p>
      ${ctaButton("Visit Club Page", clubURL)}
    `),
  }),

  clubJoinRejected: ({ username, clubName }) => ({
    subject: `Update on your ${clubName} request`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:22px">
        Join Request Update
      </h2>
      <p style="color:#6B7280;line-height:1.7;margin:0 0 16px">
        Hi <strong>${username}</strong>, unfortunately your request
        to join <strong>${clubName}</strong> was not approved at this time.
      </p>
      <p style="color:#6B7280;line-height:1.7;margin:0">
        You can explore and apply to other clubs on ${BRAND_NAME}.
      </p>
      ${ctaButton("Discover Clubs", `${process.env.CLIENT_URL}/clubs`)}
    `),
  }),

};

// ─── Main send function ───────────────────────────────────────────────────────
/**
 * Usage:
 *   await sendEmail("welcome",  { to: "user@bit.ac.in", data: { username: "john" } })
 *   await sendEmail("rsvpConfirmation", { to, data: { username, eventTitle, eventDate, eventURL } })
 */
const sendEmail = async (templateName, { to, data = {} }) => {
  const template = templates[templateName];
  if (!template) {
    console.error(`[Email] Unknown template: "${templateName}"`);
    return null;
  }

  const { subject, html } = template(data);

  const mailOptions = {
    from:    `"${BRAND_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const transporter = createTransporter();
    const info        = await transporter.sendMail(mailOptions);
    console.log(`[Email]  "${subject}" → ${to} (${info.messageId})`);
    return info;
  } catch (err) {
    // Never crash the main request flow due to an email failure
    console.error(`[Email]  Failed to send "${subject}" to ${to}:`, err.message);
    return null;
  }
};

export default sendEmail;
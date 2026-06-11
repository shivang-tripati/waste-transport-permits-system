
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/notifications/providers';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validation.data;
    const receivedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // ── 1. Notify the MFG team ──────────────────────────────────────────
    const internalResult = await sendEmail(
      process.env.CONTACT_INBOX_EMAIL ?? 'info@malbafreegurugram.com',
      `[Contact Form] ${subject}`,
      internalEmailHtml({ name, email, subject, message, receivedAt })
    );

    if (!internalResult.success) {
      console.error('[contact] failed to send internal notification:', internalResult.failureReason);
      // Don't expose provider errors to the user — still return success
      // if the auto-reply works, or a generic error if both fail.
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to send your message right now. Please try again later."
        },
        { status: 500 }
      );
    }

    // ── 2. Auto-reply to the sender ─────────────────────────────────────
    await sendEmail(
      email,
      `We received your message — Malba Free Gurugram`,
      autoReplyHtml({ name, subject })
    ).catch(err => {
      // Auto-reply failure is non-critical — log and continue
      console.error('[contact] auto-reply failed:', err);
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[POST /api/contact]', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function internalEmailHtml(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string;
}): string {
  const { name, email, subject, message, receivedAt } = data;
  // Escape HTML entities to prevent injection
  const safe = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:640px;margin:auto;padding:24px;color:#1a1a1a">
  <div style="border-left:4px solid #1d4ed8;padding-left:16px;margin-bottom:24px">
    <h2 style="margin:0;color:#1d4ed8;font-size:18px">📬 New Contact Form Submission</h2>
    <p style="margin:4px 0 0;color:#6b7280;font-size:13px">Received at ${safe(receivedAt)} IST</p>
  </div>

  <table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:24px">
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:10px 16px 10px 0;color:#6b7280;width:80px;vertical-align:top">Name</td>
      <td style="padding:10px 0;font-weight:600">${safe(name)}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:10px 16px 10px 0;color:#6b7280;vertical-align:top">Email</td>
      <td style="padding:10px 0">
        <a href="mailto:${safe(email)}" style="color:#1d4ed8">${safe(email)}</a>
      </td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:10px 16px 10px 0;color:#6b7280;vertical-align:top">Subject</td>
      <td style="padding:10px 0">${safe(subject)}</td>
    </tr>
    <tr>
      <td style="padding:10px 16px 10px 0;color:#6b7280;vertical-align:top">Message</td>
      <td style="padding:10px 0;white-space:pre-wrap;line-height:1.6">${safe(message)}</td>
    </tr>
  </table>

  <a href="mailto:${safe(email)}?subject=Re: ${encodeURIComponent(subject)}"
     style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px">
    Reply to ${safe(name)}
  </a>

  <p style="margin-top:32px;font-size:12px;color:#9ca3af">
    This message was submitted via the contact form at malbafreegurugram.com
  </p>
</body>
</html>`;
}

function autoReplyHtml(data: { name: string; subject: string }): string {
  const safe = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <div style="border-left:4px solid #16a34a;padding-left:16px;margin-bottom:24px">
    <h2 style="margin:0;color:#16a34a;font-size:18px">✅ We received your message</h2>
  </div>

  <p style="line-height:1.7">Hi <strong>${safe(data.name)}</strong>,</p>

  <p style="line-height:1.7">
    Thank you for contacting Malba Free Gurugram. We have received your message
    regarding <em>"${safe(data.subject)}"</em> and our support team will get back
    to you within 1–2 business days.
  </p>

  <p style="line-height:1.7">
    If your matter is urgent, please call our helpline directly:
    <br>
    <strong style="font-size:16px">+91 9015339966</strong>
    <br>
    <span style="color:#6b7280;font-size:13px">Available Mon–Fri, 9 AM to 6 PM</span>
  </p>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
    This is an automated acknowledgement. Please do not reply to this email —
    our team will reach out to you directly from info@malbafreegurugram.com.
  </div>
</body>
</html>`;
}
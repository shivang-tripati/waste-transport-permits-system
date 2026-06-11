/*
/ Three delivery providers:
/   sendWhatsAppTemplate — Meta Cloud API, generic (works for any registered template)
/   sendSMS              — Twilio Programmable Messaging
/   sendEmail            — Nodemailer: Zoho SMTP (prod) / Mailtrap (dev)

*/

import nodemailer from 'nodemailer';

export interface SendResult {
    success:            boolean;
    providerMessageId?: string;
    failureReason?:     string;
}

// ---------------------------------------------------------------------------
// WhatsApp — Meta Cloud API
//
// Generic payload — no event-type coupling here.
// The orchestrator builds the payload from TEMPLATE_REGISTRY; this function
// just sends whatever it receives.
// ---------------------------------------------------------------------------

export interface WhatsAppTemplatePayload {
    phone:          string;
    templateName:   string;
    languageCode:   string;
    bodyParams:     string[];   // maps to {{1}}, {{2}}, ... in BODY component
    headerParams?:  string[];   // maps to {{1}}, ... in HEADER text component (optional)
    buttonParam?:   string;     // dynamic URL suffix for CTA button index 0 (optional)
    qrImageUrl?:    string;     // hosted image URL for IMAGE header (optional)
}

export async function sendWhatsAppTemplate(
    payload: WhatsAppTemplatePayload
): Promise<SendResult> {
    try {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const token         = process.env.WHATSAPP_TOKEN;

        if (!phoneNumberId || !token) {
            return {
                success:       false,
                failureReason: 'Missing env: WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN',
            };
        }

        const components: object[] = [];

        // IMAGE header — takes priority over text header params
        if (payload.qrImageUrl) {
            components.push({
                type:       'header',
                parameters: [{ type: 'image', image: { link: payload.qrImageUrl } }],
            });
        } else if (payload.headerParams?.length) {
            // TEXT header with variable(s)
            components.push({
                type:       'header',
                parameters: payload.headerParams.map(text => ({ type: 'text', text })),
            });
        }

        // BODY — always present if there are body params
        if (payload.bodyParams.length) {
            components.push({
                type:       'body',
                parameters: payload.bodyParams.map(text => ({ type: 'text', text })),
            });
        }

        // CTA BUTTON — dynamic URL suffix
        if (payload.buttonParam !== undefined && payload.buttonParam !== '') {
            components.push({
                type:       'button',
                sub_type:   'url',
                index:      '0',
                parameters: [{ type: 'text', text: payload.buttonParam }],
            });
        }

        const requestBody = {
            messaging_product: 'whatsapp',
            to:                normalisePhone(payload.phone),
            type:              'template',
            template: {
                name:       payload.templateName,
                language:   { code: payload.languageCode },
                components,
            },
        };

        const response = await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
            {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:  `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const code = data?.error?.code     ?? 'UNKNOWN';
            const msg  = data?.error?.message  ?? `HTTP ${response.status}`;
            return { success: false, failureReason: `[${code}] ${msg}` };
        }

        return { success: true, providerMessageId: data?.messages?.[0]?.id };

    } catch (err) {
        return { success: false, failureReason: String(err) };
    }
}

// ---------------------------------------------------------------------------
// SMS — Twilio
// ---------------------------------------------------------------------------

export async function sendSMS(phone: string, message: string): Promise<SendResult> {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken  = process.env.TWILIO_AUTH_TOKEN;
        const from       = process.env.TWILIO_SMS_FROM;

        if (!accountSid || !authToken || !from) {
            return {
                success:       false,
                failureReason: 'Missing env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_SMS_FROM',
            };
        }

        const body = new URLSearchParams({
            From: from,
            To:   normalisePhone(phone),
            Body: message,
        });

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization:  'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                },
                body,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return { success: false, failureReason: data?.message ?? `HTTP ${response.status}` };
        }

        return { success: true, providerMessageId: data.sid };

    } catch (err) {
        return { success: false, failureReason: String(err) };
    }
}

// ---------------------------------------------------------------------------
// Email — Nodemailer
//   Production : Zoho SMTP (smtp.zoho.in, port 465, SSL)
//   Development: Mailtrap (catches mail, nothing reaches real inboxes)
// ---------------------------------------------------------------------------

function createTransporter() {
    console.log({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  zohoUser: process.env.ZOHO_USER,
});
    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransport({
            host:   'smtp.zoho.in',
            port:   587,
            secure: false,
            auth: {
                user: process.env.ZOHO_USER ?? '',
                pass: process.env.ZOHO_PASS ?? '',
            },
        });
    }

    // Development — Mailtrap
return nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? 'smtp.zoho.com',
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: false,
    auth: {
        user: process.env.ZOHO_USER,
        pass: process.env.ZOHO_PASS,
    },
});


}

export async function sendEmail(
    to:      string,
    subject: string,
    html:    string
): Promise<SendResult> {
    try {
        const transporter = createTransporter();
        const from        = process.env.EMAIL_FROM ?? process.env.ZOHO_USER ?? '';

        const info = await transporter.sendMail({ from, to, subject, html });

        return { success: true, providerMessageId: info.messageId };

    } catch (err: any) {
        return { success: false, failureReason: err?.message ?? String(err) };
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise any Indian phone number to E.164 (+91XXXXXXXXXX) */
export function normalisePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`; // already has country code
}
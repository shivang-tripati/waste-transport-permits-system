/**
 * Single source of truth for all notification content.
 *
 * LIVE WhatsApp templates (Meta approved):
 *   permit_approved_en  — PERMIT_APPROVED
 *   permit_rejected_en  — PERMIT_REJECTED
 * Future templates to add when approved:
 *   weighment_recorded_en — WEIGHMENT_RECORDED
 *   weighment_document_en — WEIGHMENT_DOCUMENT 
 **/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Only events that have a live, Meta-approved WhatsApp template.
 * Add to this union when a new template is approved.
 */
export type BusinessEvent =
    | 'PERMIT_APPROVED'
    | 'PERMIT_REJECTED';
// | 'WEIGHMENT_RECORDED'   ← uncomment when template approved
// | 'WEIGHMENT_DOCUMENT'   ← uncomment when template approved

// Single alias — use BusinessEvent everywhere, EventType is kept for
// backwards-compat with existing route imports.
export type EventType = BusinessEvent;

/**
 * Arbitrary key-value bag passed by callers.
 * Each event's paramBuilder + renderSMS/renderEmail pull what they need.
 */
export type TemplateData = Record<string, string | undefined>;

export interface TemplateConfig {
    /** Exact name as registered in Meta Business Manager */
    templateName: string;
    /** Language code as registered — must match Meta exactly */
    languageCode: string;
    /** Returns ordered body parameter values: {{1}}, {{2}}, ... */
    bodyParams: (data: TemplateData) => string[];
    /** Returns ordered header text parameter values, if the template has a text header */
    headerParams?: (data: TemplateData) => string[];
    /** Returns the dynamic URL suffix for the CTA button (index 0), if present */
    buttonParam?: (data: TemplateData) => string;
}

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

export const TEMPLATE_REGISTRY: Record<BusinessEvent, TemplateConfig> = {

    // permit_approved_en
    // HEADER: IMAGE (QR code — sent as hosted URL or static sample)
    // BODY:   {{1}} permitNumber  {{2}} validUntil
    // BUTTON: URL dynamic suffix = {{1}} token
    PERMIT_APPROVED: {
        templateName: 'permit_approved_en',
        languageCode: 'en',
        bodyParams: (data) => [
            data.permitNumber ?? '',
            data.validUntil   ?? '',
        ],
        buttonParam: (data) => data.token ?? '',
    },

    // permit_rejected_en
    // HEADER: TEXT  {{1}} permitNumber
    // BODY:   {{1}} permitNumber  {{2}} rejectionReason
    // BUTTON: none
    PERMIT_REJECTED: {
        templateName: 'permit_rejected_en',
        languageCode: 'en',
        headerParams: (data) => [data.permitNumber ?? ''],
        bodyParams:   (data) => [
            data.permitNumber    ?? '',
            data.reason          ?? 'No reason provided',
        ],
    },

};

// ---------------------------------------------------------------------------
// SMS fallback — plain text, used only when WhatsApp fails
// Keep under 160 chars where possible.
// ---------------------------------------------------------------------------

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://malbafreegurugram.com';

export function renderSMS(eventType: BusinessEvent, data: TemplateData): string {
    switch (eventType) {
        case 'PERMIT_APPROVED':
            return (
                `Permit ${data.permitNumber} APPROVED. ` +
                `Valid until ${data.validUntil}. ` +
                `Show at gate: ${APP_URL}/compliance/verify?token=${data.token ?? ''}`
            );

        case 'PERMIT_REJECTED': {
            const reason = (data.reason ?? '').slice(0, 80);
            const truncated = (data.reason ?? '').length > 80 ? '...' : '';
            return (
                `Permit ${data.permitNumber} REJECTED. ` +
                `Reason: ${reason}${truncated} ` +
                `Helpline: +91 9015339966`
            );
        }
    }
}

// ---------------------------------------------------------------------------
// Email fallback — only sent when BOTH WhatsApp and SMS fail for the owner
// ---------------------------------------------------------------------------

export interface EmailContent {
    subject: string;
    html:    string;
}

export function renderEmail(eventType: BusinessEvent, data: TemplateData): EmailContent {
    switch (eventType) {
        case 'PERMIT_APPROVED': {
            const url = `${APP_URL}/compliance/verify?token=${data.token ?? ''}`;
            return {
                subject: `Permit ${data.permitNumber} approved — Malba Free Gurugram`,
                html: emailWrap(
                    '#16a34a',
                    '✅ Waste Permit Approved',
                    `Your construction and demolition waste transportation permit has been approved.
                    <br><br>
                    <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px">Permit number</td>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">${data.permitNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#6b7280">Valid until</td>
                        <td style="padding:8px 0;font-weight:600">${data.validUntil}</td>
                      </tr>
                    </table>
                    Please show this to an authorised official of the Municipal Corporation of Gurugram to avoid a challan for unauthorised dumping.
                    <br><br>
                    <a href="${url}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">
                      View Permit
                    </a>
                    <br><br>
                    Share this with your driver — they will need it at the plant gate.`
                ),
            };
        }

        case 'PERMIT_REJECTED':
            return {
                subject: `Permit ${data.permitNumber} rejected — Malba Free Gurugram`,
                html: emailWrap(
                    '#dc2626',
                    '❌ Waste Permit Rejected',
                    `Your waste permit application has been rejected.
                    <br><br>
                    <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px">Permit number</td>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">${data.permitNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;vertical-align:top;color:#6b7280">Reason</td>
                        <td style="padding:8px 0">${data.reason ?? 'No reason provided'}</td>
                      </tr>
                    </table>
                    Please review the reason above, make the necessary corrections, and resubmit your application.
                    <br><br>
                    Need help? Call our log.error: <strong>+91 9015339966</strong>`
                ),
            };
    }
}

// ---------------------------------------------------------------------------
// Shared email chrome
// ---------------------------------------------------------------------------

function emailWrap(accentColor: string, heading: string, body: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a;background:#fff">
  <div style="border-left:4px solid ${accentColor};padding-left:16px;margin-bottom:24px">
    <h2 style="margin:0;color:${accentColor};font-size:20px">${heading}</h2>
  </div>
  <div style="line-height:1.7;font-size:15px">
    ${body}
  </div>
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
    This is an automated message from Malba Free Gurugram (MFG) waste management system.
    Please do not reply to this email.
  </div>
</body>
</html>`;
}
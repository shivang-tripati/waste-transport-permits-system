/**
 * WhatsApp Service
 * Handles direct communication with Meta WhatsApp Cloud API
 */
import { log } from '@/lib/logger';
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const API_VERSION = 'v17.0';

export interface SendTemplateParams {
    to: string;
    templateName: string;
    languageCode: string;
    components: any[];
}

export async function sendWhatsAppTemplate({
    to,
    templateName,
    languageCode,
    components
}: SendTemplateParams) {
    if (!META_WHATSAPP_TOKEN || !META_PHONE_NUMBER_ID) {
        console.warn('WhatsApp credentials missing. Notification will be skipped in logs.');
        throw new Error('WhatsApp configuration missing');
    }

    // Clean phone number (remove +, spaces, ensure country code)
    const cleanPhone = to.replace(/\D/g, '');

    const url = `https://graph.facebook.com/${API_VERSION}/${META_PHONE_NUMBER_ID}/messages`;

    const body = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: languageCode
            },
            components
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${META_WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (!response.ok) {
            log.error('Meta API Error:', result);
            throw new Error(result.error?.message || 'Meta API request failed');
        }

        return result;
    } catch (error) {
        log.error('WhatsApp service error:', error);
        throw error;
    }
}

/**
 * Helper to build parameters for Meta components
 */
export function buildParameters(params: string[]) {
    return [
        {
            type: 'body',
            parameters: params.map(val => ({
                type: 'text',
                text: val
            }))
        }
    ];
}

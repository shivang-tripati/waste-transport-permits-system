/**
 * WhatsApp Template Registry
 * Centralizes mapping between business events and Meta templates
 */

export type BusinessEvent =
    | 'PERMIT_SUBMITTED'
    | 'PERMIT_APPROVED'
    | 'PERMIT_REJECTED'
    | 'PERMIT_QR'
    | 'WEIGHMENT_RECORDED'
    | 'WEIGHMENT_DOCUMENT'
    | 'OTP_VERIFY';

export interface TemplateConfig {
    templateName: string;
    languageCode: string;
    paramBuilder: (data: any) => string[];
}

export const TEMPLATE_REGISTRY: Record<BusinessEvent, TemplateConfig> = {
    PERMIT_SUBMITTED: {
        templateName: 'permit_request_submitted',
        languageCode: 'en_US',
        paramBuilder: (data: { permitNumber: string; applicantName: string }) => [
            data.applicantName,
            data.permitNumber
        ],
    },
    PERMIT_APPROVED: {
        templateName: 'permit_in_transit',
        languageCode: 'en_US',
        paramBuilder: (data: { permitNumber: string; validUntil: string }) => [
            data.permitNumber,
            data.validUntil
        ],
    },
    PERMIT_REJECTED: {
        templateName: 'permit_rejected',
        languageCode: 'en_US',
        paramBuilder: (data: { permitNumber: string; reason: string }) => [
            data.permitNumber,
            data.reason
        ],
    },
    PERMIT_QR: {
        templateName: 'permit_qr_reference',
        languageCode: 'en_US',
        paramBuilder: (data: { permitNumber: string; qrUrl: string }) => [
            data.permitNumber,
            data.qrUrl
        ],
    },
    WEIGHMENT_RECORDED: {
        templateName: 'permit_delivery_recorded',
        languageCode: 'en_US',
        paramBuilder: (data: { permitNumber: string; netWeight: string; plantName: string }) => [
            data.permitNumber,
            data.netWeight,
            data.plantName
        ],
    },
    WEIGHMENT_DOCUMENT: {
        templateName: 'weighment_document',
        languageCode: 'en_US',
        paramBuilder: (data: { weighmentNumber: string; docUrl: string }) => [
            data.weighmentNumber,
            data.docUrl
        ],
    },
    OTP_VERIFY: {
        templateName: 'permit_otp_verify',
        languageCode: 'en_US',
        paramBuilder: (data: { otp: string }) => [
            data.otp
        ],
    },
};

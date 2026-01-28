import { prisma } from '@/lib/db';

// Configuration
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const MAX_OTP_ATTEMPTS = 3;
const DEV_OTP = '123456'; // Mock OTP for development

export type OTPPurpose = 'LOGIN' | 'REGISTER' | 'PERMIT_CREATE' | 'PASSWORD_RESET';

/**
 * Generate a random OTP
 */
function generateOTPCode(): string {
    // In development, always use mock OTP
    if (process.env.NODE_ENV === 'development') {
        return DEV_OTP;
    }

    // Generate random numeric OTP
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
}

/**
 * OTP Service Interface (for pluggable SMS gateways)
 */
export interface SMSGateway {
    sendOTP(phone: string, otp: string, purpose: OTPPurpose): Promise<boolean>;
}

/**
 * Mock SMS Gateway for development
 */
class MockSMSGateway implements SMSGateway {
    async sendOTP(phone: string, otp: string, purpose: OTPPurpose): Promise<boolean> {
        console.log(`[MOCK SMS] Sending OTP ${otp} to ${phone} for ${purpose}`);
        return true;
    }
}

/**
 * Twilio SMS Gateway (placeholder - implement when needed)
 */
class TwilioSMSGateway implements SMSGateway {
    async sendOTP(phone: string, otp: string, purpose: OTPPurpose): Promise<boolean> {
        // TODO: Implement Twilio integration
        // const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        // await client.messages.create({ body: `Your OTP is ${otp}`, from: TWILIO_PHONE, to: phone });
        console.log(`[TWILIO] Would send OTP ${otp} to ${phone} for ${purpose}`);
        return true;
    }
}

/**
 * MSG91 SMS Gateway (placeholder - implement when needed)
 */
class MSG91SMSGateway implements SMSGateway {
    async sendOTP(phone: string, otp: string, purpose: OTPPurpose): Promise<boolean> {
        // TODO: Implement MSG91 integration
        console.log(`[MSG91] Would send OTP ${otp} to ${phone} for ${purpose}`);
        return true;
    }
}

/**
 * Get configured SMS gateway
 */
function getSMSGateway(): SMSGateway {
    const provider = process.env.SMS_PROVIDER;

    switch (provider) {
        case 'twilio':
            return new TwilioSMSGateway();
        case 'msg91':
            return new MSG91SMSGateway();
        default:
            return new MockSMSGateway();
    }
}

/**
 * Create and send OTP
 */
export async function sendOTP(
    phone: string,
    purpose: OTPPurpose
): Promise<{ success: boolean; message?: string }> {
    // Generate OTP
    const otp = generateOTPCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing OTPs for this phone/purpose
    await prisma.oTPVerification.updateMany({
        where: {
            phone,
            purpose,
            isUsed: false,
            expiresAt: { gt: new Date() },
        },
        data: { isUsed: true },
    });

    // Create new OTP record
    await prisma.oTPVerification.create({
        data: {
            phone,
            otp,
            purpose,
            expiresAt,
        },
    });

    // Send via SMS gateway
    const gateway = getSMSGateway();
    const sent = await gateway.sendOTP(phone, otp, purpose);

    if (!sent) {
        return { success: false, message: 'Failed to send OTP' };
    }

    return { success: true };
}

/**
 * Verify OTP
 */
export async function verifyOTP(
    phone: string,
    otp: string,
    purpose: OTPPurpose
): Promise<{ success: boolean; message?: string }> {
    // Find the latest valid OTP
    const otpRecord = await prisma.oTPVerification.findFirst({
        where: {
            phone,
            purpose,
            isUsed: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
        return { success: false, message: 'OTP expired or not found' };
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        // Mark as used to prevent further attempts
        await prisma.oTPVerification.update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        });
        return { success: false, message: 'Maximum attempts exceeded' };
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
        // Increment attempts
        await prisma.oTPVerification.update({
            where: { id: otpRecord.id },
            data: { attempts: otpRecord.attempts + 1 },
        });
        return { success: false, message: 'Invalid OTP' };
    }

    // Mark as used
    await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true, usedAt: new Date() },
    });

    return { success: true };
}

/**
 * Check if OTP exists and is valid (without consuming it)
 */
export async function hasValidOTP(
    phone: string,
    purpose: OTPPurpose
): Promise<boolean> {
    const otpRecord = await prisma.oTPVerification.findFirst({
        where: {
            phone,
            purpose,
            isUsed: false,
            expiresAt: { gt: new Date() },
            attempts: { lt: MAX_OTP_ATTEMPTS },
        },
    });

    return !!otpRecord;
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '@/lib/api';
import { forgotPasswordSchema } from '@/schemas';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/lib/logger';

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: >
 *       Sends a password reset link to the user's email. Always returns
 *       success to prevent email enumeration attacks.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent (if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = forgotPasswordSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const { email } = validation.data;

        // Find user (don't reveal if user exists or not for security)
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true },
        });

        // Always return success even if user doesn't exist (security best practice)
        if (!user) {
            return createSuccessResponse({
                message: 'If an account exists with this email, a password reset link has been sent',
            });
        }

        // Generate reset token
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store reset token (reusing OTPVerification table for simplicity)
        await prisma.oTPVerification.create({
            data: {
                phone: email, // Reusing phone field for email since it's indexed
                otp: resetToken,
                purpose: 'PASSWORD_RESET',
                expiresAt,
            },
        });

        // In production, send email with reset link
        // For now, just log it
        log.info(
            `[DEV] Password reset link: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
        );

        // TODO: Integrate email sending
        // await sendEmail({
        //   to: user.email,
        //   subject: 'Password Reset Request',
        //   body: `Click here to reset your password: ${resetLink}`,
        // });

        return createSuccessResponse({
            message: 'If an account exists with this email, a password reset link has been sent',
        });
    } catch (error) {
        log.error('Forgot password error:', error);
        return createErrorResponse(error);
    }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '@/lib/api';

/**
 * PUBLIC VERIFICATION ENDPOINT
 * 
 * Rules (as per requirements):
 * ❌ No authentication required
 * ❌ No mutations allowed
 * ❌ No admin fields exposed
 * ✅ Token validation only
 * ✅ Read-only projection
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return createErrorResponse(
                CommonErrors.badRequest('Verification token is required')
            );
        }

        // Find permit by token
        const permit = await prisma.permit.findUnique({
            where: { token },
            select: {
                // Public-safe fields only
                id: true,
                permitNumber: true,
                token: true,
                status: true,
                wasteType: true,
                estimatedWeight: true,
                estimatedVolume: true,
                wasteDescription: true,

                // Pickup details
                pickupAddress: true,
                pickupCity: true,
                pickupState: true,
                pickupPincode: true,

                // Driver/Vehicle info
                driverName: true,
                driverPhone: true,
                vehicleNumber: true,
                vehicleType: true,

                // Validity
                validFrom: true,
                validUntil: true,

                // Timestamps
                createdAt: true,
                submittedAt: true,
                approvedAt: true,
                transitStartedAt: true,
                completedAt: true,

                // Project info (public-safe)
                project: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                        company: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },

                // Plant info (public-safe)
                plant: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                        contactPhone: true,
                        operatingHours: true,
                    },
                },

                // Weighment info (public-safe - no payment details)
                weighments: {
                    select: {
                        id: true,
                        weighmentNumber: true,
                        status: true,
                        grossWeight: true,
                        tareWeight: true,
                        netWeight: true,
                        weighedAt: true,
                        plant: {
                            select: { id: true, name: true, code: true },
                        },
                    },
                },
            },
        });

        if (!permit) {
            return createErrorResponse(
                CommonErrors.notFound('Permit'),
                404
            );
        }

        // Calculate validity status
        const now = new Date();
        let validityStatus: 'NOT_YET_VALID' | 'VALID' | 'EXPIRED' | 'NA' = 'NA';
        let timeRemaining: { hours: number; minutes: number; text: string } | null = null;

        if (permit.validFrom && permit.validUntil) {
            const validFrom = new Date(permit.validFrom);
            const validUntil = new Date(permit.validUntil);

            if (now < validFrom) {
                validityStatus = 'NOT_YET_VALID';
            } else if (now > validUntil) {
                validityStatus = 'EXPIRED';
            } else {
                validityStatus = 'VALID';

                // Calculate time remaining
                const diff = validUntil.getTime() - now.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                let text = '';
                if (hours > 24) {
                    const days = Math.floor(hours / 24);
                    text = `${days} day${days > 1 ? 's' : ''} remaining`;
                } else if (hours > 0) {
                    text = `${hours}h ${minutes}m remaining`;
                } else {
                    text = `${minutes}m remaining`;
                }

                timeRemaining = { hours, minutes, text };
            }
        }

        // Build response with computed fields
        const response = {
            ...permit,
            verification: {
                validityStatus,
                timeRemaining,
                isActive: ['APPROVED', 'IN_TRANSIT'].includes(permit.status) && validityStatus === 'VALID',
                checkedAt: now.toISOString(),
            },
        };

        return createSuccessResponse(response);
    } catch (error) {
        console.error('Verification error:', error);
        return createErrorResponse(error);
    }
}

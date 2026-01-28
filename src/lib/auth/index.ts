export { hashPassword, verifyPassword, validatePasswordStrength } from './password';
export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    extractBearerToken,
    getRefreshTokenExpiry,
    type AccessTokenPayload,
    type RefreshTokenPayload,
    type DecodedToken,
} from './jwt';
export {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isRoleAtLeast,
    getRolePermissions,
    canAccessResource,
    type Permission,
    type UserContext,
    type ResourceOwnership,
} from './rbac';
export {
    authenticate,
    requirePermission,
    withAuth,
    withPermission,
    getOptionalAuth,
    type AuthenticatedRequest,
    type MiddlewareResult,
} from './middleware';
export {
    sendOTP,
    verifyOTP,
    hasValidOTP,
    type OTPPurpose,
    type SMSGateway,
} from './otp';

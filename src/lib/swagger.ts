import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: 'src/app/api', // Points to where your App Router API routes are located
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Transport Permit System — API Documentation',
                version: '1.0.0',
                description:
                    'Interactive API documentation for the Waste Transport Permit Management System.\n\n' +
                    '## Authentication\n' +
                    'Most endpoints require a Bearer JWT token obtained via `/api/v1/auth/login`.\n' +
                    'For web clients, tokens are set as HttpOnly cookies automatically.',
                contact: {
                    name: 'MCG Engineering Team',
                },
            },
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'JWT access token obtained from the login endpoint',
                    },
                    CookieAuth: {
                        type: 'apiKey',
                        in: 'cookie',
                        name: 'accessToken',
                        description: 'HttpOnly cookie set automatically on login (web clients)',
                    },
                },
            },
            security: [{ BearerAuth: [] }, { CookieAuth: [] }],
            tags: [
                { name: 'Health', description: 'Health check endpoints' },
                { name: 'Auth', description: 'Authentication & session management' },
                { name: 'Profile', description: 'Current user profile management' },
                { name: 'Users', description: 'User administration (Admin only)' },
                { name: 'Companies', description: 'Company management' },
                { name: 'Projects', description: 'Project management' },
                { name: 'Plants', description: 'Waste processing plant management' },
                { name: 'Permits', description: 'Transport permit lifecycle' },
                { name: 'Weighments', description: 'Weighment recording & approval' },
                { name: 'Verification', description: 'Public permit verification' },
                { name: 'Onboarding', description: 'Company user onboarding flow' },
                { name: 'Upload', description: 'File upload service' },
                { name: 'Dashboard', description: 'Dashboard statistics' },
                { name: 'Notifications', description: 'Notification trigger endpoints' },
                { name: 'Legacy Imports', description: 'Legacy weighment data import' },
                { name: 'Debug', description: 'Debug & diagnostic endpoints' },
            ],
        },
    });
    return spec;
};
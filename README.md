# Transport Permit System

A full-stack digital transport permit management system for C&D (Construction & Demolition) waste transport.

## Features

- **User Management**: JWT-based authentication with role-based access control (Admin, Company User, Individual)
- **Permit Lifecycle**: Create, submit, approve, reject, and track transport permits
- **QR Verification**: Public verification page for permit validation without login
- **Weighment Tracking**: Record waste weights at destination plants with payment tracking
- **Audit Trail**: Full audit logging for compliance and dispute resolution

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Validation**: Zod schemas for API input validation
- **Data Fetching**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or a PostgreSQL instance

### Setup

1. **Clone and install dependencies**:
   ```bash
   cd transport-permit-system
   npm install
   ```

2. **Start PostgreSQL** (using Docker):
   ```bash
   docker-compose up -d
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run database migrations**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (login, register)
│   ├── admin/              # Admin dashboard
│   ├── dashboard/          # User dashboard
│   ├── verify/             # Public verification page
│   └── api/v1/             # API routes
├── components/ui/          # Reusable UI components
├── hooks/                  # React hooks (useAuth, usePermits)
├── lib/
│   ├── api/                # API utilities (response, audit)
│   ├── auth/               # Auth utilities (jwt, rbac, middleware)
│   ├── db/                 # Database client
│   └── query/              # TanStack Query provider
└── schemas/                # Zod validation schemas
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Permits
- `GET /api/v1/permits` - List permits (paginated, filterable)
- `POST /api/v1/permits` - Create permit
- `GET /api/v1/permits/:id` - Get permit details
- `PATCH /api/v1/permits/:id` - Update permit
- `POST /api/v1/permits/:id/submit` - Submit for approval
- `POST /api/v1/permits/:id/approve` - Approve permit (admin)
- `POST /api/v1/permits/:id/reject` - Reject permit (admin)

### Public
- `GET /api/v1/verify?token=xxx` - Verify permit (no auth required)

## Development Notes

### OTP in Development
OTP verification uses mock code `123456` in development mode. For production, configure SMS gateway (Twilio/MSG91) in environment variables.

### Database Schema
See `prisma/schema.prisma` for the complete data model including:
- Users, Companies, Projects, Plants
- Permits with full status workflow
- Weighments with embedded payment fields
- Audit logs for compliance

## License

MIT

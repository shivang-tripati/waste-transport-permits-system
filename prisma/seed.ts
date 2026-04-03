import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';
import prisma from '@/lib/db';


async function main() {
    const email = process.env.SYSTEM_ADMIN_EMAIL!;
    const password = process.env.SYSTEM_ADMIN_PASSWORD!;

    if (!email || !password) {
        throw new Error('System admin credentials missing');
    }

    const existing = await prisma.user.findFirst({
        where: {
            role: UserRole.ADMIN,
            isSystemAdmin: true,
        },
    });

    if (existing) {
        console.log('✅ System admin already exists');
        return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name: 'System Administrator',
            role: UserRole.ADMIN,
            isSystemAdmin: true,
            isActive: true,
            isEmailVerified: true,
            isPhoneVerified: true,
        },
    });

    console.log('user', user);

    console.log('✅ System admin created successfully');
}

main()
    .catch((e) => {
        console.error('❌ Failed to create system admin:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

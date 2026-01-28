import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg"

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const connectionString = `${process.env.DATABASE_URL}`

const prismaClientSingleton = () => {
    const adapter = new PrismaPg({ connectionString }); // 👈 create adapter instance

    return new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        adapter, // 👈 pass adapter object, not a string
    });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

export default prisma;

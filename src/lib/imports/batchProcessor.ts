import { prisma } from '@/lib/db';

const CHUNK = 1000;

export async function batchInsert(rows: any[], batchId: string) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.legacyWeighmentImport.createMany({
      data: rows.slice(i, i + CHUNK).map(r => ({
        ...r,
        importBatchId: batchId,
      })),
    });
  }
}

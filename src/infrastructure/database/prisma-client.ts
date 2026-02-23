import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, } from 'pg';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}



const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma =  globalForPrisma.prisma ?? 
  new PrismaClient({
    log: ['query'],
    adapter: adapter
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
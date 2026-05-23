import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to access the database.')
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl })
  return new PrismaClient({ adapter })
}

function getPrismaClient() {
  const prisma = globalForPrisma.prisma ?? createPrismaClient()

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

  return prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export { prisma }

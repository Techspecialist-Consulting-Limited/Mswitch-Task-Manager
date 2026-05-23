import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { hash } from 'bcryptjs'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  const passwordHash = await hash('password123', 12)

  const existing = await prisma.user.findUnique({ where: { email: 'admin@taskflow.com' } })
  if (existing) {
    console.log('Already seeded.')
    return
  }

  // Admin
  await prisma.user.create({
    data: { name: 'Alex Morgan', email: 'admin@taskflow.com', passwordHash, role: 'SUPER_ADMIN' },
  })
  console.log('  Admin created')

  // Units
  const unitNames = ['Engineering', 'Marketing', 'HR & Operations', 'Finance', 'Product', 'Customer Support', 'Others']
  const units: { id: string; name: string }[] = []
  for (const name of unitNames) {
    const u = await prisma.unit.create({ data: { name } })
    units.push(u)
  }
  console.log(`  ${units.length} units created`)

  // Leads
  const leads = [
    { name: 'David Park', email: 'david@taskflow.com', unitIdx: 0 },
    { name: 'Emily Rodriguez', email: 'emily@taskflow.com', unitIdx: 1 },
    { name: 'James Wilson', email: 'james@taskflow.com', unitIdx: 2 },
    { name: 'Lisa Thompson', email: 'lisa@taskflow.com', unitIdx: 3 },
    { name: 'Michael Chang', email: 'michael@taskflow.com', unitIdx: 4 },
    { name: 'Rachel Green', email: 'rachel@taskflow.com', unitIdx: 5 },
  ]
  for (const ld of leads) {
    const user = await prisma.user.create({
      data: { name: ld.name, email: ld.email, passwordHash, role: 'UNIT_LEAD', unitId: units[ld.unitIdx].id },
    })
    await prisma.unit.update({ where: { id: units[ld.unitIdx].id }, data: { leadId: user.id } })
  }
  console.log(`  ${leads.length} leads created`)

  // Staff
  const staff = [
    { name: 'Kevin Brown', email: 'kevin@taskflow.com', unitIdx: 0 },
    { name: 'Anna Liu', email: 'anna@taskflow.com', unitIdx: 0 },
    { name: 'Tom Baker', email: 'tom@taskflow.com', unitIdx: 0 },
    { name: 'Sophie Martin', email: 'sophie@taskflow.com', unitIdx: 1 },
    { name: 'Chris Davis', email: 'chris@taskflow.com', unitIdx: 1 },
    { name: 'Nina Patel', email: 'nina@taskflow.com', unitIdx: 2 },
    { name: 'Oscar Torres', email: 'oscar@taskflow.com', unitIdx: 3 },
    { name: 'Mia Johnson', email: 'mia@taskflow.com', unitIdx: 4 },
    { name: 'Liam Wright', email: 'liam@taskflow.com', unitIdx: 5 },
    { name: 'Zoe Kim', email: 'zoe@taskflow.com', unitIdx: 6 },
  ]
  for (const s of staff) {
    await prisma.user.create({
      data: { name: s.name, email: s.email, passwordHash, role: 'STAFF', unitId: units[s.unitIdx].id },
    })
  }
  console.log(`  ${staff.length} staff created`)
  console.log('Done. Login: admin@taskflow.com / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())

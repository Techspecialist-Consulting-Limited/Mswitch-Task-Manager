import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { hash } from 'bcryptjs'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('=== Setup Admin ===\n')

  // 1. List users matching test/demo patterns
  const testPatterns = ['test', 'smoke', 'example.com', '@taskflow.com']
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { email: { contains: 'smoke' } },
        { email: { endsWith: 'example.com' } },
        { email: { endsWith: '@taskflow.com' } },
      ],
    },
  })

  console.log(`Found ${testUsers.length} test/demo users:\n`)
  for (const u of testUsers) {
    console.log(`  - ${u.name} <${u.email}> (${u.role})`)
  }

  if (testUsers.length > 0) {
    const ids = testUsers.map(u => u.id)

    // Clean up related data
    console.log('\nCleaning up related data...')

    const [delGoals, delTasks, delComments, delNotifs, delKeys, delUpdates] = await Promise.all([
      prisma.monthlyGoal.deleteMany({ where: { userId: { in: ids } } }),
      prisma.task.deleteMany({ where: { OR: [{ assignedToId: { in: ids } }, { assignedById: { in: ids } }] } }),
      prisma.comment.deleteMany({ where: { userId: { in: ids } } }),
      prisma.notification.deleteMany({ where: { userId: { in: ids } } }),
      prisma.apiKey.deleteMany({ where: { userId: { in: ids } } }),
      prisma.weeklyUpdate.deleteMany({ where: { userId: { in: ids } } }),
    ])
    console.log(`  Deleted ${delGoals.count} goals, ${delTasks.count} tasks, ${delComments.count} comments, ${delNotifs.count} notifications, ${delKeys.count} API keys, ${delUpdates.count} weekly updates`)

    // Remove unit leads references
    await prisma.unit.updateMany({ where: { leadId: { in: ids } }, data: { leadId: null } })

    // Delete test users
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
    console.log(`  Deleted ${testUsers.length} test users`)
  }

  // 2. Upsert super admin
  console.log('\nSetting up super admin...')

  const adminEmail = 'taofeeq@mswitchgroup.com'
  const adminPassword = 'superadmin-me3456'
  const passwordHash = await hash(adminPassword, 12)

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (existing) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: 'Abbas Taofeeq',
        role: 'SUPER_ADMIN',
        isActive: true,
        passwordHash,
      },
    })
    console.log('  Updated existing admin account')
  } else {
    await prisma.user.create({
      data: {
        name: 'Abbas Taofeeq',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    })
    console.log('  Created new admin account')
  }

  console.log(`\nAdmin account: ${adminEmail}`)
  console.log('=== Done ===')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
}).finally(() => prisma.$disconnect())

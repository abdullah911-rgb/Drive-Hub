/**
 * Wipe all transactional / test data. Keeps:
 * - ADMIN and SUPER_ADMIN users (credentials)
 * - Roles, countries, cities (reference data the app needs)
 * - Bank details (platform config)
 *
 * Run: npm run db:purge-demo
 */
import { PrismaClient, RoleName } from '@prisma/client'
import { rm } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing transactional data (keeping admin credentials)...')

  const adminRoles = await prisma.role.findMany({
    where: { name: { in: [RoleName.ADMIN, RoleName.SUPER_ADMIN] } },
    select: { id: true, name: true },
  })
  const adminRoleIds = adminRoles.map((r) => r.id)

  if (adminRoleIds.length === 0) {
    throw new Error('No ADMIN / SUPER_ADMIN roles found. Run npm run db:seed first.')
  }

  const admins = await prisma.user.findMany({
    where: { roleId: { in: adminRoleIds }, deletedAt: null },
    select: { id: true, email: true, role: { select: { name: true } } },
  })
  console.log(`Preserving ${admins.length} admin account(s):`)
  for (const a of admins) {
    console.log(`  - ${a.email} (${a.role.name})`)
  }

  // Child → parent order (FK-safe)
  await prisma.roomImage.deleteMany()
  await prisma.room.deleteMany()
  await prisma.carImage.deleteMany()
  await prisma.carDocument.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.car.deleteMany()
  await prisma.companyDocument.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.review.deleteMany()
  await prisma.company.deleteMany()

  await prisma.notification.deleteMany()
  await prisma.otpVerification.deleteMany()
  await prisma.adminLog.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.supportTicket.deleteMany()

  const deletedUsers = await prisma.user.deleteMany({
    where: { roleId: { notIn: adminRoleIds } },
  })
  console.log(`Deleted ${deletedUsers.count} non-admin user(s)`)

  // Soft-deleted admin rows shouldn't linger either
  await prisma.user.deleteMany({
    where: {
      roleId: { in: adminRoleIds },
      deletedAt: { not: null },
    },
  })

  // Clear uploaded media (documents / images)
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads')
  for (const folder of ['companies', 'cars', 'rooms']) {
    try {
      await rm(path.join(uploadsRoot, folder), { recursive: true, force: true })
      console.log(`Cleared uploads/${folder}`)
    } catch {
      /* folder may not exist */
    }
  }

  // Ensure reference data + admin still present
  const remaining = await prisma.user.count({
    where: { roleId: { in: adminRoleIds }, deletedAt: null },
  })
  const companies = await prisma.company.count()
  const cars = await prisma.car.count()
  const rooms = await prisma.room.count()
  const users = await prisma.user.count()

  console.log('---')
  console.log(`Admins remaining: ${remaining}`)
  console.log(`Users total: ${users}`)
  console.log(`Companies: ${companies} | Cars: ${cars} | Rooms: ${rooms}`)
  console.log('Database is ready for real data entry.')
}

main()
  .catch((e) => {
    console.error('Purge failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_EMAILS = [
  'admin@drivehub.com',
  'speedwheels@example.com',
  'luxurycars@example.com',
  'customer@example.com',
  'pending@example.com',
  'newrentals@example.com',
]

async function main() {
  console.log('Removing demo data...')

  await prisma.notification.deleteMany({
    where: { user: { email: { in: DEMO_EMAILS } } },
  })

  await prisma.review.deleteMany({
    where: { user: { email: { in: DEMO_EMAILS } } },
  })

  await prisma.payment.deleteMany({})
  await prisma.subscription.deleteMany({})
  await prisma.carImage.deleteMany({})
  await prisma.car.deleteMany({})
  await prisma.company.deleteMany({})
  await prisma.user.deleteMany({
    where: { email: { in: DEMO_EMAILS } },
  })

  await prisma.bankDetails.deleteMany({})

  console.log('Demo data removed. Run npm run db:seed to create your admin account.')
}

main()
  .catch((e) => {
    console.error('Purge failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

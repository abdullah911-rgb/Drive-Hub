import { PrismaClient, RoleName, ApprovalStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const email = process.env.ADMIN_EMAIL!
const password = process.env.ADMIN_PASSWORD!
const phone = process.env.ADMIN_PHONE || '+10000000000'

async function main() {
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.SUPER_ADMIN } })
  const passwordHash = await bcrypt.hash(password, 12)

  const byEmail = await prisma.user.findUnique({ where: { email } })
  const byRole = await prisma.user.findFirst({
    where: { roleId: role.id, deletedAt: null },
  })

  const target = byEmail || byRole

  if (target) {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        email,
        phone,
        passwordHash,
        roleId: role.id,
        status: ApprovalStatus.APPROVED,
        fullName: 'Administrator',
        emailVerified: true,
        phoneVerified: true,
        deletedAt: null,
      },
    })
    console.log('Admin updated:', email)
  } else {
    await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        roleId: role.id,
        status: ApprovalStatus.APPROVED,
        fullName: 'Administrator',
        emailVerified: true,
        phoneVerified: true,
      },
    })
    console.log('Admin created:', email)
  }

  const admins = await prisma.user.findMany({
    where: { roleId: role.id, deletedAt: null },
    select: { email: true, status: true, role: { select: { name: true } } },
  })
  console.log('Admins now:', JSON.stringify(admins, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

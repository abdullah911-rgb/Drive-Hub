import { PrismaClient, RoleName, ApprovalStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { COUNTRIES } from '../src/lib/countries'

const prisma = new PrismaClient()

const CITIES_BY_COUNTRY_CODE: Record<string, string[]> = {
  PK: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
  SA: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  US: ['New York', 'Los Angeles', 'Chicago'],
  GB: ['London', 'Manchester', 'Birmingham'],
  IN: ['Delhi', 'Mumbai', 'Bangalore'],
  CA: ['Toronto', 'Vancouver', 'Montreal'],
  AU: ['Sydney', 'Melbourne', 'Brisbane'],
  DE: ['Berlin', 'Munich', 'Frankfurt'],
  QA: ['Doha', 'Al Wakrah'],
  KW: ['Kuwait City', 'Hawalli'],
  BH: ['Manama', 'Riffa'],
  OM: ['Muscat', 'Salalah'],
  BD: ['Dhaka', 'Chittagong'],
  EG: ['Cairo', 'Alexandria'],
  TR: ['Istanbul', 'Ankara'],
  FR: ['Paris', 'Marseille'],
  IT: ['Rome', 'Milan'],
  ES: ['Madrid', 'Barcelona'],
  NL: ['Amsterdam', 'Rotterdam'],
  MY: ['Kuala Lumpur', 'Penang'],
  SG: ['Singapore'],
  JP: ['Tokyo', 'Osaka'],
  ZA: ['Johannesburg', 'Cape Town'],
  BR: ['São Paulo', 'Rio de Janeiro'],
  MX: ['Mexico City', 'Guadalajara'],
}

async function main() {
  console.log('Seeding reference data...')

  const roles = [
    { name: RoleName.CUSTOMER, description: 'Car rental customer' },
    { name: RoleName.COMPANY, description: 'Car rental company or owner' },
    { name: RoleName.ADMIN, description: 'Platform administrator' },
    { name: RoleName.SUPER_ADMIN, description: 'Super administrator' },
  ]

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    })
  }
  console.log('Roles ready')

  for (const c of COUNTRIES) {
    const country = await prisma.country.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        flagUrl: c.flagUrl,
        currency: c.currency,
        dialCode: c.dialCode,
      },
      create: {
        name: c.name,
        code: c.code,
        flagUrl: c.flagUrl,
        currency: c.currency,
        dialCode: c.dialCode,
      },
    })

    for (const cityName of CITIES_BY_COUNTRY_CODE[c.code] || []) {
      await prisma.city.upsert({
        where: { name_countryId: { name: cityName, countryId: country.id } },
        update: {},
        create: { name: cityName, countryId: country.id },
      })
    }
  }
  console.log('Countries and cities ready')

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminPhone = process.env.ADMIN_PHONE || '+10000000000'

  if (adminEmail && adminPassword) {
    const roleSuperAdmin = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.SUPER_ADMIN } })
    const existingAdmin = await prisma.user.findFirst({
      where: { roleId: roleSuperAdmin.id, deletedAt: null },
    })

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      await prisma.user.create({
        data: {
          email: adminEmail,
          phone: adminPhone,
          passwordHash,
          roleId: roleSuperAdmin.id,
          status: ApprovalStatus.APPROVED,
          fullName: 'Administrator',
          emailVerified: true,
          phoneVerified: true,
        },
      })
      console.log(`Admin account created for ${adminEmail}`)
    } else {
      console.log('Admin account already exists — skipped')
    }
  } else {
    console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin account')
  }

  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

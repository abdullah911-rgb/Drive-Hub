import { prisma } from './prisma'
import { serializePrisma } from './serialize'
import { isValidUuid } from './env'

export type DbUser = {
  id: string
  email: string
  phone: string
  passwordHash: string
  roleId: string
  roleName: string
  status: string
  fullName?: string
  fatherName?: string
  cnicOrId?: string
  dateOfBirth?: string
  address?: string
  cityId?: string
  countryId?: string
  emergencyName?: string
  emergencyPhone?: string
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

function withRoleName<T extends { role: { name: string } }>(user: T) {
  const { role, ...rest } = user
  return serializePrisma({ ...rest, roleName: role.name })
}

export const db = {
  async getCountries() {
    const list = await prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return serializePrisma(list)
  },

  async getCountryById(id: string) {
    const res = await prisma.country.findUnique({ where: { id } })
    return serializePrisma(res)
  },

  async getCountryByCode(code: string) {
    const res = await prisma.country.findUnique({ where: { code } })
    return serializePrisma(res)
  },

  async getCities(countryId?: string) {
    const where = countryId ? { countryId, deletedAt: null } : { deletedAt: null }
    const list = await prisma.city.findMany({ where, orderBy: { name: 'asc' } })
    return serializePrisma(list)
  },

  async getUsers() {
    const list = await prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        role: true,
        company: {
          include: {
            documents: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return list.map(withRoleName)
  },

  async getUserById(id: string) {
    const u = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })
    if (!u || u.deletedAt) return null
    return withRoleName(u)
  },

  async getUserByEmail(email: string) {
    const u = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    })
    if (!u) return null
    return withRoleName(u)
  },

  async getUserByPhone(phone: string) {
    const u = await prisma.user.findFirst({
      where: { phone, deletedAt: null },
      include: { role: true },
    })
    if (!u) return null
    return withRoleName(u)
  },

  async getAdminUser() {
    const u = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    })
    if (!u) return null
    return withRoleName(u)
  },

  async createUser(data: {
    id?: string
    email: string
    phone: string
    passwordHash: string
    roleId?: string
    roleName?: string
    status: string
    fullName?: string
    fatherName?: string
    cnicOrId?: string
    dateOfBirth?: string
    address?: string
    cityId?: string
    countryId?: string
    emergencyName?: string
    emergencyPhone?: string
    emailVerified?: boolean
    phoneVerified?: boolean
  }) {
    let roleId = data.roleId
    const { roleName, dateOfBirth, ...rest } = data
    if (!roleId || !isValidUuid(roleId)) {
      roleId = undefined
      if (roleName) {
        const role = await prisma.role.findUnique({ where: { name: roleName as 'CUSTOMER' | 'COMPANY' | 'HOTEL' | 'ADMIN' | 'SUPER_ADMIN' } })
        roleId = role?.id
      }
    }
    if (!roleId) throw new Error('Valid role is required')
    const u = await prisma.user.create({
      data: {
        ...rest,
        roleId: roleId!,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        status: rest.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED',
      },
      include: { role: true },
    })
    return withRoleName(u)
  },

  async updateUser(id: string, data: Partial<DbUser>) {
    const { roleName, dateOfBirth, roleId, ...rest } = data
    let resolvedRoleId = roleId && isValidUuid(roleId) ? roleId : undefined
    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName as 'CUSTOMER' | 'COMPANY' | 'ADMIN' | 'SUPER_ADMIN' } })
      if (role) resolvedRoleId = role.id
    }
    const u = await prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(resolvedRoleId ? { roleId: resolvedRoleId } : {}),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        status: rest.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED' | undefined,
      },
      include: { role: true },
    })
    return withRoleName(u)
  },

  async getCompanies(filters?: { countryId?: string; cityId?: string; status?: string }) {
    const where: Record<string, unknown> = { deletedAt: null }
    if (filters?.countryId) where.countryId = filters.countryId
    if (filters?.cityId) where.cityId = filters.cityId
    if (filters?.status) where.status = filters.status
    const list = await prisma.company.findMany({
      where,
      include: {
        subscriptions: true,
        documents: { where: { deletedAt: null } },
        country: true,
      },
    })
    return serializePrisma(list)
  },

  async getCompanyById(id: string) {
    const res = await prisma.company.findUnique({
      where: { id },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' } },
        cars: { where: { deletedAt: null }, include: { images: true } },
        rooms: { where: { deletedAt: null }, include: { images: true } },
      },
    })
    return serializePrisma(res)
  },

  async getCompanyByUserId(userId: string) {
    const res = await prisma.company.findUnique({
      where: { userId },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' } },
        country: true,
      },
    })
    return serializePrisma(res)
  },

  async createCompany(data: {
    id?: string
    userId: string
    name: string
    ownerName: string
    cnicOrId: string
    contactNumber: string
    whatsAppNumber: string
    email: string
    businessAddress: string
    licenseNumber: string
    profilePicture?: string
    cityId: string
    countryId: string
    status: string
    companyType?: 'CAR_RENTAL' | 'HOTEL'
  }) {
    const res = await prisma.company.create({
      data: {
        ...data,
        status: data.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED',
      },
    })
    return serializePrisma(res)
  },

  async updateCompany(id: string, data: Record<string, unknown>) {
    const res = await prisma.company.update({
      where: { id },
      data: {
        ...data,
        status: data.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED' | undefined,
      },
    })
    return serializePrisma(res)
  },

  async createCompanyDocuments(
    documents: { id: string; companyId: string; docType: string; fileUrl: string }[]
  ) {
    if (documents.length === 0) return []
    const res = await prisma.companyDocument.createMany({ data: documents })
    return res
  },

  async getCars(filters?: {
    countryId?: string
    cityId?: string
    brand?: string
    fuelType?: string
    transmission?: string
    seatingCapacity?: number
    status?: string
    companyId?: string
  }) {
    const where: Record<string, unknown> = { deletedAt: null }
    if (filters?.countryId) where.countryId = filters.countryId
    if (filters?.cityId) where.cityId = filters.cityId
    if (filters?.fuelType) where.fuelType = filters.fuelType
    if (filters?.transmission) where.transmission = filters.transmission
    if (filters?.seatingCapacity) where.seatingCapacity = { gte: filters.seatingCapacity }
    if (filters?.status) where.status = filters.status
    if (filters?.companyId) where.companyId = filters.companyId
    if (filters?.brand) where.brand = { contains: filters.brand, mode: 'insensitive' }
    const list = await prisma.car.findMany({
      where,
      include: { images: true },
    })
    return serializePrisma(list)
  },

  async getCarById(id: string) {
    const res = await prisma.car.findUnique({
      where: { id },
      include: { images: true },
    })
    return serializePrisma(res)
  },

  async createCar(data: {
    id?: string
    companyId: string
    countryId: string
    cityId: string
    name: string
    brand: string
    model: string
    year: number
    color: string
    regNumber: string
    engineNumber: string
    mileage: number
    fuelType: string
    seatingCapacity: number
    transmission: string
    description: string
    features: string[]
    status: string
    images?: { imageUrl: string; imageType: string; isPrimary: boolean }[]
  }) {
    const { images, ...carData } = data
    const res = await prisma.car.create({
      data: {
        ...carData,
        fuelType: carData.fuelType as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'LPG' | 'CNG',
        transmission: carData.transmission as 'MANUAL' | 'AUTOMATIC',
        status: carData.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED',
        images: {
          create: images?.map((img) => ({
            imageUrl: img.imageUrl,
            imageType: img.imageType,
            isPrimary: img.isPrimary,
          })),
        },
      },
      include: { images: true },
    })
    return serializePrisma(res)
  },

  async updateCar(id: string, data: Record<string, unknown>) {
    const { images, ...carData } = data
    if (images) {
      await prisma.carImage.deleteMany({ where: { carId: id } })
    }
    const res = await prisma.car.update({
      where: { id },
      data: {
        ...carData,
        ...(images
          ? {
              images: {
                create: (images as { imageUrl: string; imageType: string; isPrimary: boolean }[]).map((img) => ({
                  imageUrl: img.imageUrl,
                  imageType: img.imageType,
                  isPrimary: img.isPrimary,
                })),
              },
            }
          : {}),
      },
      include: { images: true },
    })
    return serializePrisma(res)
  },

  async getSubscriptionByCompanyId(companyId: string) {
    const res = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
    return serializePrisma(res)
  },

  async createSubscription(data: {
    id?: string
    companyId: string
    planName: string
    maxCars: number
    price: number
    durationDays: number
    features: string[]
    status: string
    startDate?: string
    endDate?: string
  }) {
    const res = await prisma.subscription.create({
      data: {
        ...data,
        status: data.status as 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED',
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })
    return serializePrisma(res)
  },

  async updateSubscription(id: string, data: Record<string, unknown>) {
    const { startDate, endDate, ...rest } = data
    const res = await prisma.subscription.update({
      where: { id },
      data: {
        ...rest,
        status: rest.status as 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED' | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
    })
    return serializePrisma(res)
  },

  async getAllSubscriptions() {
    const list = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: { company: true },
    })
    return serializePrisma(list)
  },

  async getReviewsByCompanyId(companyId: string) {
    const list = await prisma.review.findMany({
      where: { companyId, isVisible: true },
      include: { user: { select: { fullName: true, email: true } } },
    })
    return serializePrisma(list)
  },

  async createReview(data: {
    id?: string
    companyId: string
    userId: string
    rating: number
    comment: string
    isVisible?: boolean
  }) {
    const res = await prisma.review.create({ data })
    return serializePrisma(res)
  },

  async getAllReviews() {
    const list = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } }, company: { select: { name: true } } },
    })
    return serializePrisma(list)
  },

  async updateReview(id: string, data: { isVisible?: boolean }) {
    const res = await prisma.review.update({ where: { id }, data })
    return serializePrisma(res)
  },

  async getNotificationsByUserId(userId: string) {
    const list = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    })
    return serializePrisma(list)
  },

  async createNotification(data: {
    id?: string
    userId: string
    type: string
    title: string
    message: string
    isRead?: boolean
  }) {
    const res = await prisma.notification.create({
      data: {
        ...data,
        type: data.type as 'ACCOUNT_APPROVED' | 'ACCOUNT_REJECTED' | 'CAR_APPROVED' | 'CAR_REJECTED' | 'SUBSCRIPTION_EXPIRING' | 'SUBSCRIPTION_EXPIRED' | 'NEW_REVIEW' | 'NEW_PAYMENT' | 'GENERAL',
      },
    })
    return serializePrisma(res)
  },

  async markNotificationRead(id: string) {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })
  },

  async getPayments() {
    const list = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { company: true } } },
    })
    return serializePrisma(list)
  },

  async createPayment(data: {
    id?: string
    subscriptionId: string
    amount: number
    currency: string
    gateway: string
    transactionId: string
    receiptUrl?: string
    status: string
    accountDetails?: string
    verifiedAt?: string
  }) {
    const res = await prisma.payment.create({
      data: {
        ...data,
        status: data.status as 'PENDING' | 'REQUIRES_ACTION' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED',
        verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : undefined,
      },
    })
    return serializePrisma(res)
  },

  async updatePayment(id: string, data: Record<string, unknown>) {
    const { verifiedAt, paidAt, ...rest } = data
    const res = await prisma.payment.update({
      where: { id },
      data: {
        ...rest,
        status: rest.status as 'PENDING' | 'REQUIRES_ACTION' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | undefined,
        verifiedAt: verifiedAt ? new Date(verifiedAt as string) : undefined,
        paidAt: paidAt ? new Date(paidAt as string) : undefined,
      },
    })
    return serializePrisma(res)
  },

  async getBankDetails() {
    const details = await prisma.bankDetails.findFirst()
    return serializePrisma(details)
  },

  async updateBankDetails(data: { bankName?: string; accountNumber?: string; accountName?: string }) {
    const details = await prisma.bankDetails.findFirst()
    if (!details) {
      return serializePrisma(await prisma.bankDetails.create({ data: data as { bankName: string; accountNumber: string; accountName: string } }))
    }
    const res = await prisma.bankDetails.update({
      where: { id: details.id },
      data,
    })
    return serializePrisma(res)
  },

  async getStats() {
    const totalUsers = await prisma.user.count({ where: { deletedAt: null } })
    const totalCustomers = await prisma.user.count({
      where: { role: { name: 'CUSTOMER' }, deletedAt: null },
    })
    const totalCompanies = await prisma.company.count({ where: { deletedAt: null } })
    const totalCars = await prisma.car.count({ where: { deletedAt: null } })
    const totalRooms = await prisma.room.count({ where: { deletedAt: null } })

    const pendingApprovals =
      (await prisma.user.count({ where: { status: 'PENDING' } })) +
      (await prisma.company.count({ where: { status: 'PENDING' } })) +
      (await prisma.car.count({ where: { status: 'PENDING' } })) +
      (await prisma.room.count({ where: { status: 'PENDING' } }))

    const activeSubscriptions = await prisma.subscription.count({ where: { status: 'ACTIVE' } })

    const payments = await prisma.payment.findMany({ where: { status: 'PAID' } })
    const revenueByCurrency: Record<string, number> = {}
    payments.forEach((p) => {
      revenueByCurrency[p.currency] = (revenueByCurrency[p.currency] || 0) + Number(p.amount)
    })

    return {
      totalUsers,
      totalCustomers,
      totalCompanies,
      totalCars,
      totalRooms,
      pendingApprovals,
      activeSubscriptions,
      totalRevenuePKR: revenueByCurrency['PKR'] || 0,
      totalRevenueSAR: revenueByCurrency['SAR'] || 0,
      revenueByCurrency,
    }
  },

  async getRooms(filters?: {
    countryId?: string
    cityId?: string
    roomType?: string
    capacity?: number
    status?: string
    companyId?: string
    search?: string
  }) {
    const where: Record<string, unknown> = { deletedAt: null }
    if (filters?.countryId) where.countryId = filters.countryId
    if (filters?.cityId) where.cityId = filters.cityId
    if (filters?.roomType) where.roomType = filters.roomType
    if (filters?.capacity) where.capacity = { gte: filters.capacity }
    if (filters?.status) where.status = filters.status
    if (filters?.companyId) where.companyId = filters.companyId
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    const list = await prisma.room.findMany({
      where,
      include: { images: true },
    })
    return serializePrisma(list)
  },

  async getRoomById(id: string) {
    const res = await prisma.room.findUnique({
      where: { id },
      include: { images: true },
    })
    return serializePrisma(res)
  },

  async createRoom(data: {
    id?: string
    companyId: string
    countryId: string
    cityId: string
    name: string
    roomType: string
    pricePerNight: number
    capacity: number
    floor?: string
    description: string
    amenities?: string[]
    status: string
    images?: { imageUrl: string; imageType: string; isPrimary: boolean }[]
  }) {
    const { images, ...roomData } = data
    const res = await prisma.room.create({
      data: {
        ...roomData,
        status: roomData.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED',
        images: {
          create: images?.map((img) => ({
            imageUrl: img.imageUrl,
            imageType: img.imageType,
            isPrimary: img.isPrimary,
          })),
        },
      },
      include: { images: true },
    })
    return serializePrisma(res)
  },

  async updateRoom(id: string, data: Record<string, unknown>) {
    const { images, ...roomData } = data
    if (images) {
      await prisma.roomImage.deleteMany({ where: { roomId: id } })
    }
    const res = await prisma.room.update({
      where: { id },
      data: {
        ...roomData,
        ...(images
          ? {
              images: {
                create: (images as { imageUrl: string; imageType: string; isPrimary: boolean }[]).map((img) => ({
                  imageUrl: img.imageUrl,
                  imageType: img.imageType,
                  isPrimary: img.isPrimary,
                })),
              },
            }
          : {}),
      },
      include: { images: true },
    })
    return serializePrisma(res)
  },
}

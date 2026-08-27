
export type RoleName = 'CUSTOMER' | 'COMPANY' | 'HOTEL' | 'ADMIN' | 'SUPER_ADMIN'
export type CompanyType = 'CAR_RENTAL' | 'HOTEL'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'REQUIRES_ACTION' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
export type FuelType = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'LPG' | 'CNG'
export type TransmissionType = 'MANUAL' | 'AUTOMATIC'
export type PaymentProvider = 'mock' | 'rapid_gateway' | 'moyasar'
export type PaymentMethod =
  | 'jazzcash'
  | 'easypaisa'
  | 'card'
  | 'apple_pay'
  | 'mada'

export interface Country {
  id: string
  name: string
  code: string
  flagUrl: string
  currency: string
  dialCode: string
}

export interface City {
  id: string
  name: string
  countryId: string
  country?: Country
}

export interface User {
  id: string
  email: string
  phone: string
  
  password?: string | null
  roleId: string
  roleName: RoleName
  status: ApprovalStatus
  emailVerified: boolean
  phoneVerified: boolean
  fullName?: string
  fatherName?: string
  cnicOrId?: string
  dateOfBirth?: string
  address?: string
  cityId?: string
  city?: City
  countryId?: string
  country?: Country
  emergencyName?: string
  emergencyPhone?: string
  company?: Company
  createdAt: string
  updatedAt: string
}

export interface CompanyDocument {
  id: string
  companyId: string
  docType: string
  fileUrl: string
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
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
  city?: City
  countryId: string
  country?: Country
  status: ApprovalStatus
  companyType?: CompanyType
  documents?: CompanyDocument[]
  subscriptions?: Subscription[]
  cars?: Car[]
  rooms?: Room[]
  reviews?: Review[]
  averageRating?: number
  totalReviews?: number
  totalCars?: number
  totalRooms?: number
  createdAt: string
  updatedAt: string
}

export interface CarImage {
  id: string
  carId: string
  imageUrl: string
  imageType: string
  isPrimary: boolean
}

export interface Car {
  id: string
  companyId: string
  company?: Company
  countryId: string
  country?: Country
  cityId: string
  city?: City
  name: string
  brand: string
  model: string
  year: number
  color: string
  regNumber: string
  engineNumber: string
  mileage: number
  fuelType: FuelType
  seatingCapacity: number
  transmission: TransmissionType
  description: string
  features: string[]
  status: ApprovalStatus
  images: CarImage[]
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  companyId: string
  planName: string
  maxCars: number
  price: number
  durationDays: number
  features: string[]
  status: SubscriptionStatus
  startDate?: string
  endDate?: string
  payments?: Payment[]
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  countryCode: string
  gateway: string
  provider: PaymentProvider
  paymentMethod: PaymentMethod
  providerPaymentId?: string
  accountDetails?: string
  transactionId: string
  checkoutUrl?: string
  returnUrl?: string
  receiptUrl?: string
  status: PaymentStatus
  statusDetails?: string
  webhookEventId?: string
  checkoutPayload?: Record<string, unknown>
  providerResponse?: Record<string, unknown>
  lastWebhookPayload?: Record<string, unknown>
  paidAt?: string
  verifiedAt?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface BankDetails {
  bankName: string
  accountNumber: string
  accountName: string
}

export interface Review {
  id: string
  companyId: string
  userId: string
  user?: Pick<User, 'fullName' | 'email'>
  rating: number
  comment: string
  isVisible: boolean
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  totalCustomers: number
  totalCompanies: number
  totalCars: number
  totalRooms: number
  pendingApprovals: number
  activeSubscriptions: number
  totalRevenuePKR: number
  totalRevenueSAR: number
  revenueByCurrency?: Record<string, number>
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface CustomerRegisterForm {
  fullName: string
  fatherName: string
  cnicOrId: string
  dateOfBirth: string
  phone: string
  email: string
  address: string
  cityId: string
  countryId: string
  emergencyName: string
  emergencyPhone: string
  password: string
  confirmPassword: string
}

export interface CompanyRegisterForm {
  companyName: string
  ownerName: string
  cnicOrId: string
  contactNumber: string
  whatsAppNumber: string
  email: string
  businessAddress: string
  cityId: string
  countryId: string
  licenseNumber: string
  password: string
  confirmPassword: string
}

export interface LoginForm {
  emailOrPhone: string
  password: string
  role: RoleName
}

export interface CarFilters {
  countryId?: string
  cityId?: string
  brand?: string
  fuelType?: string
  transmission?: string
  seatingCapacity?: number
  search?: string
}

export interface RoomImage {
  id: string
  roomId: string
  imageUrl: string
  imageType: string
  isPrimary: boolean
}

export interface Room {
  id: string
  companyId: string
  company?: Company
  countryId: string
  country?: Country
  cityId: string
  city?: City
  name: string
  hotelName: string
  roomType: string
  pricePerNight: number
  capacity: number
  bedType: string
  description: string
  features: string[]
  status: ApprovalStatus
  images: RoomImage[]
  createdAt: string
  updatedAt: string
}

export interface RoomFilters {
  countryId?: string
  cityId?: string
  roomType?: string
  capacity?: number
  search?: string
}

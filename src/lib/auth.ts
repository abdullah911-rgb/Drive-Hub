import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getJwtSecret } from './env'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  status: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

const AUTH_COOKIE = 'auth_token'

/** Prefer Secure cookies on HTTPS (Vercel/Safari). Fall back for local HTTP. */
function cookieSecure(): boolean {
  if (process.env.NODE_ENV !== 'production') return false
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (appUrl.startsWith('http://')) return false
  return true
}

function authCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, token, authCookieOptions(60 * 60 * 24 * 7))
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  // Mirror set attributes so Safari/Chrome actually clear the cookie
  cookieStore.set(AUTH_COOKIE, '', { ...authCookieOptions(0) })
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value || null
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken()
  if (!token) return null
  return verifyToken(token)
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least one number')
  return { valid: errors.length === 0, errors }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getJwtSecret } from '@/lib/env'

const PUBLIC_PATHS = ['/', '/about', '/auth', '/contact', '/privacy', '/terms', '/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/countries', '/api/cities']
const COMPANY_PATHS = ['/dashboard/company']
const ADMIN_PATHS = ['/dashboard/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/dashboard/customer')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/cars') ||
    pathname.startsWith('/api/companies') ||
    pathname.startsWith('/marketplace') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/admin')) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return NextResponse.next()
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    const role = payload.role as string
    const status = payload.status as string

    if (status === 'BANNED' || status === 'SUSPENDED') {
      return NextResponse.redirect(new URL('/auth?error=account_suspended', request.url))
    }

    if (ADMIN_PATHS.some(p => pathname.startsWith(p)) && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/auth?error=unauthorized', request.url))
    }
    if (COMPANY_PATHS.some(p => pathname.startsWith(p)) && role !== 'COMPANY') {
      return NextResponse.redirect(new URL('/auth?error=unauthorized', request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)
    requestHeaders.set('x-user-role', role)
    requestHeaders.set('x-user-status', status)

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {

    if (pathname.startsWith('/dashboard')) {
      const response = NextResponse.redirect(new URL('/auth', request.url))
      response.cookies.delete('auth_token')
      return response
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

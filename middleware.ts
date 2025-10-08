import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simple session check using cookies
  const sessionToken = request.cookies.get('authjs.session-token') ||
                       request.cookies.get('__Secure-authjs.session-token')

  const { pathname } = request.nextUrl

  // Protected routes
  const protectedPaths = [
    '/dashboard',
    '/api/clients',
    '/api/cases',
    '/api/documents',
    '/api/time-entries',
    '/api/invoices',
  ]

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath && !sessionToken) {
    // Redirect to sign-in page
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/clients/:path*',
    '/api/cases/:path*',
    '/api/documents/:path*',
    '/api/time-entries/:path*',
    '/api/invoices/:path*',
  ],
}
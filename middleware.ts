import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'hr'],
  
  // Used when no locale matches
  defaultLocale: 'hr',
  
  // Always show locale in URL
  localePrefix: 'as-needed'
})

export async function middleware(request: NextRequest) {
  // Handle internationalization first
  const intlResponse = intlMiddleware(request)
  
  // If intl middleware is redirecting, return that response
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }

  // Simple session check using cookies
  const sessionToken = request.cookies.get('authjs.session-token') ||
                       request.cookies.get('__Secure-authjs.session-token')

  const { pathname } = request.nextUrl

  // Protected routes (excluding API routes and auth routes)
  const protectedPaths = [
    '/dashboard',
    '/client-portal',
  ]

  const isProtectedPath = protectedPaths.some(path => pathname.includes(path))
  const isApiRoute = pathname.startsWith('/api/')
  const isAuthRoute = pathname.includes('/sign-in') || pathname.includes('/sign-up') || 
                     pathname.includes('/forgot-password') || pathname.includes('/reset-password') ||
                     pathname.includes('/verify-email')

  if (isProtectedPath && !sessionToken && !isApiRoute && !isAuthRoute) {
    // Redirect to sign-in page with locale
    const locale = pathname.split('/')[1] || 'hr'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/sign-in`
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return intlResponse
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(hr|en)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ],
}
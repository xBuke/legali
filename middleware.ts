import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = ['/sign-in', '/sign-up', '/']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

  // Get session token from cookies (NextAuth v5 uses different cookie names)
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token') ||
                request.cookies.get('authjs.session-token') ||
                request.cookies.get('__Secure-authjs.session-token')

  // If trying to access protected route without token, redirect to sign-in
  if (!isPublicPath && !token) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // If trying to access auth pages with token, redirect to dashboard
  if ((request.nextUrl.pathname === '/sign-in' || request.nextUrl.pathname === '/sign-up') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next|api|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
import { auth } from '@/lib/auth'

export default auth

export const config = {
  matcher: [
    // Protected routes that require authentication
    '/dashboard/:path*',
    '/api/clients/:path*',
    '/api/cases/:path*',
    '/api/documents/:path*',
    '/api/time-entries/:path*',
    '/api/invoices/:path*',
  ],
}
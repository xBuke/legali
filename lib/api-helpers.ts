import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Types for authenticated user context
export interface AuthenticatedUser {
  userId: string
  organizationId: string
  role: string
}

// Type for API route handlers with authentication
export type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: AuthenticatedUser }
) => Promise<NextResponse> | NextResponse

/**
 * Get the authenticated user from the session
 * @returns AuthenticatedUser object or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    // First check if session cookie exists
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('authjs.session-token') ||
                        cookieStore.get('__Secure-authjs.session-token')

    if (!sessionToken) {
      console.log('No session token found in cookies')
      return null
    }

    // Get session using NextAuth
    const session = await auth()

    if (!session?.user?.id) {
      console.log('No user in session')
      return null
    }

    // Extract user information from session
    const userId = session.user.id
    const organizationId = session.user.organizationId
    const role = session.user.role

    if (!organizationId) {
      console.error('User session missing organizationId:', session.user)
      return null
    }

    return {
      userId,
      organizationId,
      role: role || 'user'
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Create an authenticated API route handler
 * @param handler - The actual route handler function
 * @returns Wrapped handler with authentication check
 */
export function createAuthenticatedRoute(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      // Get authenticated user
      const user = await getAuthenticatedUser()
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        )
      }

      // Call the handler with user context
      return await handler(request, { user })
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: 'Internal server error during authentication' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to create a simple authenticated GET handler
 * @param handler - Function that takes user context and returns data
 * @returns Authenticated GET handler
 */
export function createAuthenticatedGET<T>(
  handler: (user: AuthenticatedUser) => Promise<T> | T
) {
  return createAuthenticatedRoute(async (request, { user }) => {
    try {
      const data = await handler(user)
      return NextResponse.json(data)
    } catch (error) {
      console.error('GET handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

/**
 * Helper to create a simple authenticated POST handler
 * @param handler - Function that takes request body and user context, returns data
 * @returns Authenticated POST handler
 */
export function createAuthenticatedPOST<T, R>(
  handler: (body: T, user: AuthenticatedUser) => Promise<R> | R
) {
  return createAuthenticatedRoute(async (request, { user }) => {
    try {
      const body = await request.json()
      const data = await handler(body, user)
      return NextResponse.json(data, { status: 201 })
    } catch (error) {
      console.error('POST handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

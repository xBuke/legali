import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { validateRequiredEnvironment } from '@/lib/env-validation'

// Validate environment on module load
try {
  validateRequiredEnvironment()
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown environment validation error';
  console.error('❌ Authentication configuration failed - Environment validation error:', errorMessage)
  throw error
}

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-out',
    error: '/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email i lozinka su obavezni')
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
          include: {
            organization: true,
          },
        })

        if (!user) {
          throw new Error('Neispravni podaci za prijavu')
        }

        // Handle 2FA verified login
        if (credentials.password === '2fa-verified') {
          if (!user.isActive) {
            throw new Error('Vaš račun je deaktiviran')
          }
          
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            organizationId: user.organizationId,
            role: user.role,
          }
        }

        // Regular password verification
        if (!user.password) {
          throw new Error('Neispravni podaci za prijavu')
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isCorrectPassword) {
          throw new Error('Neispravni podaci za prijavu')
        }

        if (!user.isActive) {
          throw new Error('Vaš račun je deaktiviran')
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          organizationId: user.organizationId,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.organizationId = user.organizationId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.organizationId = token.organizationId as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

// Export for backward compatibility
export { auth as getServerSession }

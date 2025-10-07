import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    organizationId: string
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      organizationId: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    organizationId: string
    role: string
  }
}

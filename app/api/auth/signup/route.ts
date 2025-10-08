import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// TypeScript types for request and response
interface SignupRequest {
  name: string
  email: string
  password: string
}

interface SignupResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
    organizationId: string
  }
  organization?: {
    id: string
    name: string
    subscriptionTier: string
    subscriptionStatus: string
  }
}

interface SignupError {
  error: string
}

export async function POST(request: Request): Promise<NextResponse<SignupResponse | SignupError>> {
  try {
    const body = await request.json()
    const { name, email, password, firstName: providedFirstName, lastName: providedLastName, organizationName: providedOrgName } = body

    // Support both name-based and firstName/lastName-based signup
    let firstName: string
    let lastName: string | null
    let organizationName: string

    if (providedFirstName) {
      // Use provided firstName and lastName
      firstName = providedFirstName.trim()
      lastName = providedLastName?.trim() || null
      organizationName = providedOrgName?.trim() || `${firstName} ${lastName || ''}`.trim()
    } else if (name) {
      // Split name into firstName and lastName
      const trimmedName = name.trim()
      const nameParts = trimmedName.split(' ')
      firstName = nameParts[0]
      lastName = nameParts.slice(1).join(' ') || null
      organizationName = providedOrgName?.trim() || `${firstName} ${lastName || ''}`.trim()
    } else {
      return NextResponse.json(
        { error: 'Ime je obavezno' },
        { status: 400 }
      )
    }

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i lozinka su obavezni' },
        { status: 400 }
      )
    }

    // Trim email
    const trimmedEmail = email.trim().toLowerCase()

    if (!firstName || !trimmedEmail || !password) {
      return NextResponse.json(
        { error: 'Sva polja moraju biti popunjena' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Molimo unesite valjanu email adresu' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Lozinka mora imati najmanje 8 znakova' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: trimmedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Korisnik s tim emailom već postoji' },
        { status: 400 }
      )
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create organization and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create organization with trial period
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14-day trial

      const organization = await tx.organization.create({
        data: {
          name: organizationName || `${firstName} ${lastName || ''}`.trim(),
          subscriptionTier: 'BASIC',
          subscriptionStatus: 'TRIAL',
          trialEndsAt,
          storageLimit: BigInt(53687091200), // 50GB in bytes
        },
      })

      // Create user (first user is always ADMIN)
      const user = await tx.user.create({
        data: {
          email: trimmedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN',
          organizationId: organization.id,
          isActive: true,
        },
      })

      return { organization, user }
    })

    // Return success response (NO password in response)
    const response: SignupResponse = {
      success: true,
      message: 'Račun uspješno kreiran',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        organizationId: result.user.organizationId,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        subscriptionTier: result.organization.subscriptionTier,
        subscriptionStatus: result.organization.subscriptionStatus,
      },
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Signup error:', error)

    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Log Prisma-specific error codes
      if ('code' in error) {
        console.error('Prisma error code:', (error as any).code)
      }
    }

    // Handle specific database errors
    if (error instanceof Error) {
      // Check for unique constraint violations
      if (error.message.includes('Unique constraint') || error.message.includes('unique') || (error as any).code === 'P2002') {
        return NextResponse.json(
          { error: 'Korisnik s tim emailom već postoji' },
          { status: 400 }
        )
      }

      // Check for connection errors
      if (error.message.includes('connection') || error.message.includes('connect') || (error as any).code === 'P1001') {
        console.error('Database connection error detected')
        return NextResponse.json(
          { error: 'Greška povezivanja s bazom podataka. Molimo pokušajte ponovno.' },
          { status: 500 }
        )
      }

      // Check for authentication errors
      if ((error as any).code === 'P1000') {
        console.error('Database authentication error detected')
        return NextResponse.json(
          { error: 'Greška autentifikacije baze podataka. Molimo kontaktirajte administratora.' },
          { status: 500 }
        )
      }

      // Check for server closed connection
      if ((error as any).code === 'P1017') {
        console.error('Database server closed connection')
        return NextResponse.json(
          { error: 'Baza podataka je zatvorila konekciju. Molimo pokušajte ponovno.' },
          { status: 500 }
        )
      }

      // Check for other database errors
      if (error.message.includes('Database') || error.message.includes('prisma') || (error as any).code?.startsWith('P')) {
        console.error('Prisma/Database error detected:', (error as any).code)
        return NextResponse.json(
          { error: 'Greška baze podataka. Molimo pokušajte ponovno.' },
          { status: 500 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Došlo je do greške pri registraciji. Molimo pokušajte ponovno.' },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Metoda nije dozvoljena' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Metoda nije dozvoljena' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Metoda nije dozvoljena' },
    { status: 405 }
  )
}

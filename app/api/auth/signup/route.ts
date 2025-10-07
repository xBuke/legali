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
    const body: SignupRequest = await request.json()
    const { name, email, password } = body

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Sva polja su obavezna (ime, email, lozinka)' },
        { status: 400 }
      )
    }

    // Trim whitespace
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName || !trimmedEmail || !password) {
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

    // Split name into firstName and lastName
    const nameParts = trimmedName.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || null

    // Create organization and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create organization with trial period
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14-day trial

      const organization = await tx.organization.create({
        data: {
          name: `${trimmedName} Law Firm`,
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
    console.error('Signup error:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      // Check for unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Korisnik s tim emailom već postoji' },
          { status: 400 }
        )
      }
      
      // Check for other database errors
      if (error.message.includes('Database')) {
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

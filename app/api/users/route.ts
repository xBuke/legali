import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageUsers } from '@/lib/permissions'

export const dynamic = 'force-dynamic';

// GET /api/users - List all users in the organization
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await db.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju korisnika' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user (for admins)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can manage team members (only ADMINs)
    if (!canManageUsers(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za upravljanje članovima tima' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, role } = body

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Sva obavezna polja moraju biti popunjena' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['ADMIN', 'LAWYER', 'PARALEGAL', 'ACCOUNTANT', 'VIEWER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Neispravna uloga' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Korisnik s tim emailom već postoji' },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        organizationId: session.user.organizationId,
        emailVerified: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      user,
      message: 'Korisnik je uspješno kreiran'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Greška pri kreiranju korisnika' },
      { status: 500 }
    )
  }
}

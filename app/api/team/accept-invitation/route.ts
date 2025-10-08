import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/team/accept-invitation - Accept team invitation and create user account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password, firstName, lastName } = body

    // Validate input
    if (!token || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Sva obavezna polja moraju biti popunjena' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await db.teamInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Neispravna pozivnica' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Pozivnica nije aktivna' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      // Mark invitation as expired
      await db.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json(
        { error: 'Pozivnica je istekla' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: invitation.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Korisnik već postoji' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and update invitation in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          firstName,
          lastName,
          role: invitation.role,
          organizationId: invitation.organizationId,
          emailVerified: new Date(), // Auto-verify since they came from invitation
        }
      })

      // Update invitation status
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedUserId: user.id,
        }
      })

      return user
    })

    // Send welcome email
    await sendWelcomeEmail(
      result.email,
      result.firstName || '',
      invitation.organization.name
    )

    return NextResponse.json({
      success: true,
      message: 'Račun je uspješno kreiran',
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        organization: invitation.organization,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Greška pri prihvaćanju pozivnice' },
      { status: 500 }
    )
  }
}

// GET /api/team/accept-invitation?token=xxx - Get invitation details for acceptance page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token je obavezan' },
        { status: 400 }
      )
    }

    const invitation = await db.teamInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            name: true,
          }
        },
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Neispravna pozivnica' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Pozivnica nije aktivna' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Pozivnica je istekla' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organization: invitation.organization,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
      }
    })

  } catch (error) {
    console.error('Error fetching invitation details:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju detalja pozivnice' },
      { status: 500 }
    )
  }
}

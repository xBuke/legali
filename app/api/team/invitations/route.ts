import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageUsers } from '@/lib/permissions'
import { sendTeamInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET /api/team/invitations - List all invitations for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      )
    }

    // Check if user can manage team members (only ADMINs)
    if (!canManageUsers(session.user.role as any)) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za upravljanje članovima tima' },
        { status: 403 }
      )
    }

    const invitations = await db.teamInvitation.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        acceptedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching team invitations:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju pozivnica' },
      { status: 500 }
    )
  }
}

// POST /api/team/invitations - Create a new team invitation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      )
    }

    // Check if user can manage team members (only ADMINs)
    if (!canManageUsers(session.user.role as any)) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za upravljanje članovima tima' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role } = body

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email i uloga su obavezni' },
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

    // Check if user already exists in the organization
    const existingUser = await db.user.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: session.user.organizationId,
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Korisnik već postoji u vašoj organizaciji' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await db.teamInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: session.user.organizationId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Pozivnica za ovaj email već postoji' },
        { status: 400 }
      )
    }

    // Generate secure invitation token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const invitation = await db.teamInvitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
        invitedById: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        organization: {
          select: {
            name: true,
          }
        }
      }
    })

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitation.token}`
    
    const emailSent = await sendTeamInvitationEmail({
      inviteeEmail: invitation.email,
      inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      organizationName: invitation.organization.name,
      role: invitation.role,
      invitationUrl,
      expiresAt: invitation.expiresAt,
    })

    if (!emailSent) {
      console.warn('Failed to send invitation email, but invitation was created')
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy,
        organization: invitation.organization,
        createdAt: invitation.createdAt,
        // Only return token in development
        ...(process.env.NODE_ENV === 'development' && { token: invitation.token })
      },
      message: emailSent ? 'Pozivnica je uspješno poslana' : 'Pozivnica je kreirana, ali email nije poslan'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating team invitation:', error)
    return NextResponse.json(
      { error: 'Greška pri slanju pozivnice' },
      { status: 500 }
    )
  }
}

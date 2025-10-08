import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageUsers } from '@/lib/permissions'
import { sendTeamInvitationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// GET /api/team/invitations/[id] - Get specific invitation details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      )
    }

    const invitation = await db.teamInvitation.findFirst({
      where: {
        id: params.id,
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
        },
        organization: {
          select: {
            name: true,
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Pozivnica nije pronađena' },
        { status: 404 }
      )
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju pozivnice' },
      { status: 500 }
    )
  }
}

// PATCH /api/team/invitations/[id] - Update invitation (cancel, resend, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { action } = body

    const invitation = await db.teamInvitation.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Pozivnica nije pronađena' },
        { status: 404 }
      )
    }

    let updatedInvitation

    switch (action) {
      case 'cancel':
        if (invitation.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Možete otkazati samo aktivne pozivnice' },
            { status: 400 }
          )
        }
        
        updatedInvitation = await db.teamInvitation.update({
          where: { id: params.id },
          data: { 
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        })
        break

      case 'resend':
        if (invitation.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Možete ponovno poslati samo aktivne pozivnice' },
            { status: 400 }
          )
        }

        // Extend expiration date by 7 days
        const newExpiresAt = new Date()
        newExpiresAt.setDate(newExpiresAt.getDate() + 7)

        updatedInvitation = await db.teamInvitation.update({
          where: { id: params.id },
          data: { 
            expiresAt: newExpiresAt,
            updatedAt: new Date()
          },
          include: {
            invitedBy: {
              select: {
                firstName: true,
                lastName: true,
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
        
        await sendTeamInvitationEmail({
          inviteeEmail: invitation.email,
          inviterName: `${updatedInvitation.invitedBy.firstName} ${updatedInvitation.invitedBy.lastName}`,
          organizationName: updatedInvitation.organization.name,
          role: invitation.role,
          invitationUrl,
          expiresAt: newExpiresAt,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Neispravna akcija' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      invitation: updatedInvitation,
      message: action === 'cancel' ? 'Pozivnica je otkazana' : 'Pozivnica je ponovno poslana'
    })

  } catch (error) {
    console.error('Error updating invitation:', error)
    return NextResponse.json(
      { error: 'Greška pri ažuriranju pozivnice' },
      { status: 500 }
    )
  }
}

// DELETE /api/team/invitations/[id] - Delete invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const invitation = await db.teamInvitation.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Pozivnica nije pronađena' },
        { status: 404 }
      )
    }

    await db.teamInvitation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Pozivnica je obrisana'
    })

  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json(
      { error: 'Greška pri brisanju pozivnice' },
      { status: 500 }
    )
  }
}

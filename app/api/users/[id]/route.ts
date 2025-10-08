import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageUsers } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/users/[id] - Get specific user details
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

    const user = await db.user.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
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
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju korisnika' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user details
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
    const { firstName, lastName, role, isActive } = body

    const user = await db.user.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      )
    }

    // Prevent admin from deactivating themselves
    if (user.id === session.user.id && isActive === false) {
      return NextResponse.json(
        { error: 'Ne možete deaktivirati vlastiti račun' },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['ADMIN', 'LAWYER', 'PARALEGAL', 'ACCOUNTANT', 'VIEWER']
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Neispravna uloga' },
          { status: 400 }
        )
      }
    }

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
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
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Korisnik je uspješno ažuriran'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Greška pri ažuriranju korisnika' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Deactivate user (soft delete)
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

    const user = await db.user.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: 'Ne možete obrisati vlastiti račun' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    await db.user.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Korisnik je deaktiviran'
    })

  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: 'Greška pri deaktivaciji korisnika' },
      { status: 500 }
    )
  }
}

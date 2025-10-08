import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token i nova lozinka su obavezni' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Lozinka mora imati najmanje 8 znakova' },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Neispravan ili istekao token za resetiranje' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Lozinka je uspješno resetirana'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Greška pri resetiranju lozinke' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify token validity
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

    // Check if token is valid and not expired
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Neispravan ili istekao token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Greška pri provjeri tokena' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email je obavezan' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { organization: true }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'Ako postoji račun s tim emailom, poslat ćemo vam link za resetiranje lozinke'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    // Send reset email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Resetiranje lozinke - iLegal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resetiranje lozinke</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Resetiranje lozinke</h1>
            <p>iLegal sustav</p>
          </div>
          
          <div class="content">
            <p>Pozdrav ${user.firstName || ''},</p>
            
            <p>Primili smo zahtjev za resetiranje lozinke za vaš račun u sustavu iLegal.</p>
            
            <p>Kliknite na gumb ispod da resetirate svoju lozinku:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Resetiraj lozinku</a>
            </div>
            
            <p><strong>Važne informacije:</strong></p>
            <ul>
              <li>Link je valjan 1 sat</li>
              <li>Link možete koristiti samo jednom</li>
              <li>Ako niste zatražili resetiranje lozinke, zanemarite ovu poruku</li>
            </ul>
            
            <p>Ako gumb ne radi, kopirajte i zalijepite ovaj link u svoj preglednik:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <p>Lijep pozdrav,<br>
            Tim iLegal</p>
          </div>
          
          <div class="footer">
            <p>© 2024 iLegal. Sva prava pridržana.</p>
          </div>
        </body>
        </html>
      `
    })

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email)
      return NextResponse.json(
        { error: 'Greška pri slanju emaila. Molimo pokušajte ponovno.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ako postoji račun s tim emailom, poslat ćemo vam link za resetiranje lozinke'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Greška pri obradi zahtjeva' },
      { status: 500 }
    )
  }
}

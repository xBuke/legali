// Email service for sending team invitations and notifications
// Currently using a simple console log approach for development
// In production, integrate with Resend, SendGrid, or similar service

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface TeamInvitationEmailData {
  inviteeEmail: string
  inviterName: string
  organizationName: string
  role: string
  invitationUrl: string
  expiresAt: Date
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 EMAIL WOULD BE SENT:')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('HTML:', options.html)
      console.log('---')
      return true
    }

    // TODO: Integrate with Resend or other email service
    // Example with Resend:
    /*
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const { data, error } = await resend.emails.send({
      from: 'iLegal <noreply@ilegal.app>',
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error('Email sending error:', error)
      return false
    }

    console.log('Email sent successfully:', data)
    return true
    */

    // For now, return true to simulate successful sending
    console.log('📧 Email service not configured - would send to:', options.to)
    return true

  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendTeamInvitationEmail(data: TeamInvitationEmailData): Promise<boolean> {
  const { inviteeEmail, inviterName, organizationName, role, invitationUrl, expiresAt } = data

  const subject = `Pozivnica za pridruživanje timu - ${organizationName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pozivnica za pridruživanje timu</title>
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
        .button:hover {
          background: #5a6fd8;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        .role-badge {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pozivnica za pridruživanje timu</h1>
        <p>Dobrodošli u ${organizationName}!</p>
      </div>
      
      <div class="content">
        <p>Pozdrav,</p>
        
        <p><strong>${inviterName}</strong> vas poziva da se pridružite timu <strong>${organizationName}</strong> kao <span class="role-badge">${getRoleDisplayName(role)}</span>.</p>
        
        <p>Kliknite na gumb ispod da kreirate svoj račun i pristupite sustavu:</p>
        
        <div style="text-align: center;">
          <a href="${invitationUrl}" class="button">Pridruži se timu</a>
        </div>
        
        <p><strong>Važne informacije:</strong></p>
        <ul>
          <li>Pozivnica istječe: <strong>${expiresAt.toLocaleDateString('hr-HR')}</strong></li>
          <li>Nakon kreiranja računa, možete se prijaviti na sustav</li>
          <li>Vaša uloga: <strong>${getRoleDisplayName(role)}</strong></li>
        </ul>
        
        <p>Ako niste očekivali ovu pozivnicu, možete je zanemariti.</p>
        
        <p>Lijep pozdrav,<br>
        Tim iLegal</p>
      </div>
      
      <div class="footer">
        <p>Ova poruka je poslana automatski. Molimo ne odgovarajte na nju.</p>
        <p>© 2024 iLegal. Sva prava pridržana.</p>
      </div>
    </body>
    </html>
  `

  const text = `
Pozivnica za pridruživanje timu - ${organizationName}

Pozdrav,

${inviterName} vas poziva da se pridružite timu ${organizationName} kao ${getRoleDisplayName(role)}.

Kliknite na link ispod da kreirate svoj račun:
${invitationUrl}

Važne informacije:
- Pozivnica istječe: ${expiresAt.toLocaleDateString('hr-HR')}
- Nakon kreiranja računa, možete se prijaviti na sustav
- Vaša uloga: ${getRoleDisplayName(role)}

Ako niste očekivali ovu pozivnicu, možete je zanemariti.

Lijep pozdrav,
Tim iLegal
  `

  return await sendEmail({
    to: inviteeEmail,
    subject,
    html,
    text,
  })
}

// Helper function to get role display name
function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    ADMIN: 'Administrator',
    LAWYER: 'Odvjetnik',
    PARALEGAL: 'Pravni pomoćnik',
    ACCOUNTANT: 'Računovođa',
    VIEWER: 'Preglednik',
  }
  return roleNames[role] || role
}

// Welcome email for new team members
export async function sendWelcomeEmail(email: string, firstName: string, organizationName: string): Promise<boolean> {
  const subject = `Dobrodošli u ${organizationName}!`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dobrodošli u iLegal</title>
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
        <h1>Dobrodošli u iLegal!</h1>
        <p>Vaš račun je uspješno kreiran</p>
      </div>
      
      <div class="content">
        <p>Pozdrav ${firstName},</p>
        
        <p>Dobrodošli u <strong>${organizationName}</strong>! Vaš račun je uspješno kreiran i možete se prijaviti u sustav.</p>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-in" class="button">Prijavite se</a>
        </div>
        
        <p><strong>Sljedeći koraci:</strong></p>
        <ul>
          <li>Prijavite se u sustav koristeći svoje podatke</li>
          <li>Pregledajte svoju ulogu i dozvole</li>
          <li>Počnite raditi s klijentima i predmetima</li>
        </ul>
        
        <p>Ako imate pitanja, obratite se administratoru tima.</p>
        
        <p>Lijep pozdrav,<br>
        Tim iLegal</p>
      </div>
      
      <div class="footer">
        <p>© 2024 iLegal. Sva prava pridržana.</p>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: email,
    subject,
    html,
  })
}

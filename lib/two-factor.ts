import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * 2FA (Two-Factor Authentication) Utilities
 * Implements TOTP-based 2FA with backup codes
 */

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  isBackupCode?: boolean;
}

/**
 * Generate a new TOTP secret for a user
 */
export function generateTwoFactorSecret(userEmail: string, organizationName: string): string {
  return speakeasy.generateSecret({
    name: `iLegal (${organizationName})`,
    issuer: 'iLegal',
    length: 32
  }).base32;
}

/**
 * Generate QR code URL for authenticator app setup
 */
export async function generateQRCode(secret: string, userEmail: string, organizationName: string): Promise<string> {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret,
    label: userEmail,
    issuer: 'iLegal',
    algorithm: 'sha1',
    digits: 6,
    period: 30
  });

  try {
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Verify TOTP code
 */
export function verifyTOTPCode(secret: string, token: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) of tolerance
    });
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    return false;
  }
}

/**
 * Verify backup code
 */
export function verifyBackupCode(backupCodes: string[], code: string): boolean {
  if (!backupCodes || !Array.isArray(backupCodes)) {
    return false;
  }
  
  const index = backupCodes.indexOf(code.toUpperCase());
  if (index === -1) {
    return false;
  }
  
  // Remove used backup code (one-time use)
  backupCodes.splice(index, 1);
  return true;
}

/**
 * Complete 2FA setup for a user
 */
export async function setupTwoFactor(userEmail: string, organizationName: string): Promise<TwoFactorSetup> {
  try {
    // Generate secret
    const secret = generateTwoFactorSecret(userEmail, organizationName);
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(secret, userEmail, organizationName);
    
    // Generate backup codes
    const backupCodes = generateBackupCodes(8);
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    throw new Error('Failed to setup 2FA');
  }
}

/**
 * Verify 2FA code (TOTP or backup code)
 */
export function verifyTwoFactorCode(
  secret: string, 
  backupCodes: string[], 
  code: string
): TwoFactorVerification {
  // First try TOTP verification
  if (verifyTOTPCode(secret, code)) {
    return { isValid: true, isBackupCode: false };
  }
  
  // Then try backup code verification
  if (verifyBackupCode(backupCodes, code)) {
    return { isValid: true, isBackupCode: true };
  }
  
  return { isValid: false };
}

/**
 * Generate new backup codes
 */
export function regenerateBackupCodes(): string[] {
  return generateBackupCodes(8);
}

/**
 * Validate 2FA code format
 */
export function validateTwoFactorCode(code: string): boolean {
  // TOTP codes are 6 digits
  if (/^\d{6}$/.test(code)) {
    return true;
  }
  
  // Backup codes are 8 alphanumeric characters
  if (/^[A-Z0-9]{8}$/.test(code.toUpperCase())) {
    return true;
  }
  
  return false;
}

/**
 * Get time remaining for current TOTP window
 */
export function getTOTPTimeRemaining(): number {
  const epoch = Math.round(new Date().getTime() / 1000.0);
  const timeStep = 30; // 30 seconds
  return timeStep - (epoch % timeStep);
}

/**
 * Croatian translations for 2FA messages
 */
export const twoFactorMessages = {
  setup: {
    title: 'Postavite dvofaktorsku autentifikaciju',
    description: 'Skenirajte QR kod pomoću aplikacije za autentifikaciju',
    qrCodeLabel: 'QR kod za postavljanje',
    backupCodesTitle: 'Rezervni kodovi',
    backupCodesDescription: 'Spremite ove kodove na sigurno mjesto. Možete ih koristiti za pristup ako izgubite telefon.',
    verifyTitle: 'Potvrdite postavljanje',
    verifyDescription: 'Unesite 6-znamenkasti kod iz aplikacije za autentifikaciju',
    verifyButton: 'Potvrdi',
    setupComplete: 'Dvofaktorska autentifikacija je uspješno postavljena!'
  },
  verification: {
    title: 'Dvofaktorska autentifikacija',
    description: 'Unesite 6-znamenkasti kod iz aplikacije za autentifikaciju ili rezervni kod',
    totpLabel: 'Kod za autentifikaciju',
    backupCodeLabel: 'Rezervni kod',
    verifyButton: 'Potvrdi',
    invalidCode: 'Neispravan kod. Molimo pokušajte ponovno.',
    timeRemaining: 'Vrijeme do sljedećeg koda: {seconds}s'
  },
  management: {
    title: 'Sigurnosne postavke',
    twoFactorEnabled: 'Dvofaktorska autentifikacija je omogućena',
    twoFactorDisabled: 'Dvofaktorska autentifikacija je onemogućena',
    enableButton: 'Omogući 2FA',
    disableButton: 'Onemogući 2FA',
    regenerateBackupCodes: 'Regeneriraj rezervne kodove',
    backupCodesUsed: 'Korišteni rezervni kodovi: {count}/8'
  },
  errors: {
    setupFailed: 'Postavljanje 2FA nije uspješno. Molimo pokušajte ponovno.',
    verificationFailed: 'Provjera koda nije uspješna.',
    invalidSecret: 'Neispravan tajni ključ.',
    qrCodeGenerationFailed: 'Generiranje QR koda nije uspješno.',
    backupCodeGenerationFailed: 'Generiranje rezervnih kodova nije uspješno.'
  }
};


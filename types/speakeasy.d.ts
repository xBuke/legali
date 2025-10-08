declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    length?: number;
    name?: string;
    issuer?: string;
  }

  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    qr_code_ascii: string;
    qr_code_hex: string;
    qr_code_base32: string;
    google_auth_qr: string;
    otpauth_url: string;
  }

  export interface VerifyOptions {
    secret: string;
    encoding?: string;
    token: string;
    window?: number;
  }

  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
  export function totp(options: { secret: string; encoding?: string }): string;
  export function totp_verify(options: VerifyOptions): boolean;
}

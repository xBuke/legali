import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')

if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY not set in environment. Using random key (not suitable for production).')
}

export function encryptFile(buffer: Buffer): { encryptedData: Buffer; iv: string } {
  const iv = crypto.randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()])
  
  return {
    encryptedData,
    iv: iv.toString('hex'),
  }
}

export function decryptFile(encryptedData: Buffer, ivHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex')
  const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  
  return Buffer.concat([decipher.update(encryptedData), decipher.final()])
}

export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex')
}

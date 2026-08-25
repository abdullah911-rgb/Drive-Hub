import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { getJwtSecret } from './env'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  // Derive a stable 32-byte key from the JWT secret
  return createHash('sha256').update(Buffer.from(getJwtSecret())).digest()
}

/** Encrypt a password so admins can view/update credentials. Login still uses bcrypt. */
export function encryptPassword(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

export function decryptPassword(payload: string | null | undefined): string | null {
  if (!payload) return null
  try {
    const [version, ivB64, tagB64, dataB64] = payload.split(':')
    if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) return null
    const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ])
    return dec.toString('utf8')
  } catch {
    return null
  }
}

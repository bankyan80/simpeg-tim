import crypto from 'crypto'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false
  const [salt, key] = stored.split(':')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return key === hash
}

export const DEFAULT_PASSWORD = '123456'
export const ADMIN_PASSWORD = 'kepeg017'

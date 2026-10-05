import { randomInt } from 'crypto';

// Readable temporary password: no 0/O or 1/l/I, so it survives being read out or texted.
export function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[randomInt(chars.length)]).join('');
}

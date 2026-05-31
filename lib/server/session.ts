import { cookies } from 'next/headers';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const COOKIE_NAME = '__session';

function getSecretKey(): Buffer {
  const hex = process.env.SESSION_SECRET;
  if (!hex || hex.length !== 64) {
    throw new Error('SESSION_SECRET must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

function encrypt(payload: object): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // iv(12) + tag(16) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decrypt(token: string): object | null {
  try {
    const key = getSecretKey();
    const buf = Buffer.from(token, 'base64url');

    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
}

interface SessionPayload {
  accessToken: string;
}

export function createSessionCookie(accessToken: string): string {
  const payload: SessionPayload = { accessToken };
  const value = encrypt(payload);

  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=1800${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

export function deleteSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const payload = decrypt(cookie.value) as SessionPayload | null;
  return payload?.accessToken ?? null;
}

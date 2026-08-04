import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * 로컬 E2E용 __session 쿠키 위조기.
 * OAuth 로그인은 자동화가 불가하므로, 백엔드 JwtTokenProvider(HS-SHA over BASE64URL-decoded
 * JWT_SECRET)와 프론트 lib/server/session.ts(AES-256-GCM of {accessToken})를 그대로 재현한다.
 *
 * 시크릿은 env 또는 .env 파일에서 런타임에 읽는다 — 절대 하드코딩/커밋하지 않는다.
 *   JWT_SECRET     : env 또는 ../shg-trip-back/.env (BACK_ENV_PATH 로 경로 재지정 가능)
 *   SESSION_SECRET : env 또는 ./.env.local
 *   E2E_USER_ID    : 대상 유저(기본 1)
 */
function readEnvValue(file: string, key: string): string | null {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch {
    /* 파일 없음 → null */
  }
  return null;
}

const FRONT_ENV = path.resolve(process.cwd(), '.env.local');
const BACK_ENV = process.env.BACK_ENV_PATH ?? path.resolve(process.cwd(), '../shg-trip-back/.env');

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str: string): Buffer {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function mintSessionCookie(
  userId: string | number = process.env.E2E_USER_ID ?? '1',
  role = 'USER',
): string {
  // 1) 백엔드 JWT (키 길이에 따라 HS256/384/512 자동 선택)
  const jwtSecret = process.env.JWT_SECRET ?? readEnvValue(BACK_ENV, 'JWT_SECRET');
  if (!jwtSecret) throw new Error(`JWT_SECRET을 찾을 수 없습니다 (env 또는 ${BACK_ENV})`);
  const keyBytes = b64urlDecode(jwtSecret);
  const bits = keyBytes.length * 8;
  const [alg, hash] =
    bits >= 512 ? ['HS512', 'sha512'] : bits >= 384 ? ['HS384', 'sha384'] : ['HS256', 'sha256'];

  const now = Math.floor(Date.now() / 1000);
  const header = { alg, typ: 'JWT' };
  const payload = { sub: String(userId), role, iat: now, exp: now + 12 * 3600 };
  const signingInput =
    `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(Buffer.from(JSON.stringify(payload)))}`;
  const sig = crypto.createHmac(hash, keyBytes).update(signingInput).digest();
  const jwt = `${signingInput}.${b64url(sig)}`;

  // 2) AES-256-GCM으로 { accessToken } 암호화 (lib/server/session.ts와 동일 포맷)
  const sessionSecret = process.env.SESSION_SECRET ?? readEnvValue(FRONT_ENV, 'SESSION_SECRET');
  if (!sessionSecret || sessionSecret.length !== 64) {
    throw new Error('SESSION_SECRET은 64자리 hex여야 합니다 (env 또는 .env.local)');
  }
  const key = Buffer.from(sessionSecret, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify({ accessToken: jwt }), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export const OAUTH_PURPOSE_COOKIE = 'oauth_purpose';

export function clearOAuthPurposeCookie(): string {
  return `${OAUTH_PURPOSE_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

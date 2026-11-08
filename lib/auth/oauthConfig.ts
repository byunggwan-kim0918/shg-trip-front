import { clearWithdrawPending, markWithdrawPending } from './withdrawal';

export type Provider = 'KAKAO' | 'GOOGLE' | 'NAVER';

interface OAuthProviderConfig {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const OAUTH_CONFIG: Record<Provider, OAuthProviderConfig> = {
  KAKAO: {
    authUrl: 'https://kauth.kakao.com/oauth/authorize',
    clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
    redirectUri: `${APP_URL}/callback/kakao`,
    scope: 'profile_nickname profile_image account_email',
  },
  GOOGLE: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirectUri: `${APP_URL}/callback/google`,
    scope: 'openid profile email',
  },
  NAVER: {
    authUrl: 'https://nid.naver.com/oauth2.0/authorize',
    clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '',
    redirectUri: `${APP_URL}/callback/naver`,
    scope: '',
  },
};

export type OAuthPurpose = 'login' | 'withdraw';

/**
 * 탈퇴 본인 확인에서 제공자에 남은 로그인 세션만으로 통과하지 않게 한다.
 * 구글은 자격 증명 재입력을 강제하는 파라미터가 없어 계정 재선택까지만 요구한다.
 */
const REAUTH_PARAMS: Record<Provider, Record<string, string>> = {
  KAKAO: { prompt: 'login' },
  NAVER: { auth_type: 'reauthenticate' },
  GOOGLE: { prompt: 'select_account' },
};

export async function getOAuthUrl(provider: Provider, purpose: OAuthPurpose = 'login'): Promise<string> {
  const config = OAUTH_CONFIG[provider];

  const stateRes = await fetch('/api/auth/oauth-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ purpose }),
  });
  const { data } = await stateRes.json();
  const state: string = data.state;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType || 'code',
    state,
  });

  if (config.scope) {
    params.set('scope', config.scope);
  }
  if (purpose === 'withdraw') {
    for (const [key, value] of Object.entries(REAUTH_PARAMS[provider])) params.set(key, value);
    markWithdrawPending();
  } else {
    clearWithdrawPending();
  }

  return `${config.authUrl}?${params.toString()}`;
}

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

export async function getOAuthUrl(provider: Provider): Promise<string> {
  const config = OAUTH_CONFIG[provider];

  // BFF에서 state 생성 + HttpOnly 쿠키 설정
  const stateRes = await fetch('/api/auth/oauth-state', {
    method: 'POST',
    credentials: 'include',
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

  return `${config.authUrl}?${params.toString()}`;
}

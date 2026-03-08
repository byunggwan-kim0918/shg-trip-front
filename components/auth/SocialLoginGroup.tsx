import SocialLoginButton from './SocialLoginButton';
import type { Provider } from '@/lib/auth/oauthConfig';

const PROVIDERS: Provider[] = ['KAKAO', 'GOOGLE', 'NAVER', 'APPLE'];

export default function SocialLoginGroup() {
  return (
    <div className="flex flex-col gap-3 w-full">
      {PROVIDERS.map((provider) => (
        <SocialLoginButton key={provider} provider={provider} />
      ))}
    </div>
  );
}

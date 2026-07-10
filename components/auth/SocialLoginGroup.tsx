import SocialLoginButton from './SocialLoginButton';
import type { Provider } from '@/lib/auth/oauthConfig';

const PROVIDERS: Provider[] = ['KAKAO', 'GOOGLE', 'NAVER'];

export default function SocialLoginGroup() {
  return (
    <div className="flex w-full flex-col gap-[11px]">
      {PROVIDERS.map((provider) => (
        <SocialLoginButton key={provider} provider={provider} />
      ))}
    </div>
  );
}

'use client';

import { type Provider, getOAuthUrl } from '@/lib/auth/oauthConfig';
import KakaoIcon from '@/components/icons/KakaoIcon';
import GoogleIcon from '@/components/icons/GoogleIcon';
import NaverIcon from '@/components/icons/NaverIcon';

/**
 * 버튼 위계 (리디자인 스펙):
 * 카카오만 브랜드 채움(#FEE500). 구글·네이버는 아웃라인(surface+border)이고
 * 브랜드 색은 좌측 아이콘에만 적용 → 네이버 초록 버튼이 CTA처럼 튀는 문제 해결.
 */
const PROVIDER_STYLES: Record<Provider, {
  container: string;
  iconClass?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  KAKAO: {
    container: 'bg-[#FEE500] hover:bg-[#F5DC00] text-[#191600] font-bold',
    label: '카카오로 3초 만에 시작',
    icon: KakaoIcon,
  },
  GOOGLE: {
    container: 'bg-surface border border-card-border hover:bg-surface-hover text-foreground font-semibold',
    label: 'Google로 계속하기',
    icon: GoogleIcon,
  },
  NAVER: {
    container: 'bg-surface border border-card-border hover:bg-surface-hover text-foreground font-semibold',
    iconClass: 'text-[#03C75A]',
    label: '네이버로 계속하기',
    icon: NaverIcon,
  },
};

interface SocialLoginButtonProps {
  provider: Provider;
}

export default function SocialLoginButton({ provider }: SocialLoginButtonProps) {
  const style = PROVIDER_STYLES[provider];
  const Icon = style.icon;

  const handleClick = async () => {
    window.location.href = await getOAuthUrl(provider);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex w-full cursor-pointer items-center justify-center gap-[9px]
        rounded-[13px] px-6 py-[15px]
        text-[14.5px]
        transition-all duration-200
        hover:scale-[1.01] active:scale-[0.99]
        ${style.container}
      `}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${style.iconClass ?? ''}`} />
      <span>{style.label}</span>
    </button>
  );
}

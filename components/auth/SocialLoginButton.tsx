'use client';

import { type Provider, getOAuthUrl } from '@/lib/auth/oauthConfig';
import KakaoIcon from '@/components/icons/KakaoIcon';
import GoogleIcon from '@/components/icons/GoogleIcon';
import NaverIcon from '@/components/icons/NaverIcon';
import AppleIcon from '@/components/icons/AppleIcon';

const PROVIDER_STYLES: Record<Provider, {
  bg: string;
  text: string;
  border?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  KAKAO: {
    bg: 'bg-[#FEE500] hover:bg-[#F5DC00]',
    text: 'text-[#191919]',
    label: '카카오로 시작하기',
    icon: KakaoIcon,
  },
  GOOGLE: {
    bg: 'bg-white hover:bg-gray-50',
    text: 'text-[#1F1F1F]',
    border: 'border border-gray-200',
    label: 'Google로 시작하기',
    icon: GoogleIcon,
  },
  NAVER: {
    bg: 'bg-[#03C75A] hover:bg-[#02b351]',
    text: 'text-white',
    label: '네이버로 시작하기',
    icon: NaverIcon,
  },
  APPLE: {
    bg: 'bg-black hover:bg-gray-900',
    text: 'text-white',
    label: 'Apple로 시작하기',
    icon: AppleIcon,
  },
};

interface SocialLoginButtonProps {
  provider: Provider;
}

export default function SocialLoginButton({ provider }: SocialLoginButtonProps) {
  const style = PROVIDER_STYLES[provider];
  const Icon = style.icon;

  const handleClick = () => {
    window.location.href = getOAuthUrl(provider);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center justify-center gap-3
        px-6 py-3.5 rounded-xl
        text-[15px] font-medium
        transition-all duration-200
        hover:scale-[1.01] active:scale-[0.99]
        cursor-pointer
        ${style.bg} ${style.text} ${style.border || ''}
      `}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{style.label}</span>
    </button>
  );
}

# ⚛️ CLAUDE_FRONTEND.md - Next.js 프론트엔드

> 프론트엔드 작업 시 적용되는 규칙. 공통 규칙은 루트 `CLAUDE.md` 참조.

---

## 📌 기술 스택 (실제 설치 상태)

```yaml
Framework: Next.js 16.1.1 (App Router)
Language: TypeScript 5 (strict mode)
UI: React 19.2.3
Styling: Tailwind CSS 4 (@theme inline, CSS 변수 기반 다크모드)
State: Zustand 5.0.11
HTTP: fetch API (커스텀 래퍼 - lib/api/fetchClient.ts)
Lint: ESLint 9 + eslint-config-next
PostCSS: @tailwindcss/postcss 4
Font: Geist Sans + Geist Mono (next/font/google)
```

### 미설치 라이브러리 (필요 시 추가)
- UI 컴포넌트: shadcn/ui 미설치 → 직접 구현 또는 추후 설치
- 서버 상태: TanStack Query 미설치 → fetch + Zustand로 관리 중
- HTTP: axios 미설치 → fetch API 사용
- 폼: React Hook Form + Zod 미설치
- 지도: Mapbox/Google Maps 미설치
- DnD: @dnd-kit 미설치

---

## 🏗️ 프로젝트 구조 (현재 상태)

```
shg-trip-front/
├── app/
│   ├── (auth)/                        # 인증 라우트 그룹 ✅
│   │   ├── layout.tsx
│   │   ├── login/page.tsx             # 소셜 로그인 (Kakao/Google/Naver)
│   │   ├── onboarding/page.tsx        # 닉네임 설정
│   │   └── callback/[provider]/page.tsx # OAuth 콜백 처리
│   │
│   ├── main/                          # 메인 라우트 (AuthGuard 보호) ✅
│   │   ├── layout.tsx                 # 'use client' - Sidebar + Header + main
│   │   └── page.tsx                   # 대시보드 (placeholder)
│   │
│   ├── layout.tsx                     # 루트 레이아웃 (ThemeInitializer, metadata)
│   ├── page.tsx                       # 랜딩 페이지
│   ├── globals.css                    # CSS 변수 + 다크모드 + @theme inline
│   └── icon.svg
│
├── components/
│   ├── auth/                          # ✅ 구현 완료
│   │   ├── AuthGuard.tsx              # 인증 상태 확인 + 리다이렉트
│   │   ├── SocialLoginButton.tsx
│   │   └── SocialLoginGroup.tsx
│   ├── common/
│   │   └── LoadingSpinner.tsx
│   ├── icons/                         # ✅ 구현 완료
│   │   ├── GoogleIcon.tsx
│   │   ├── KakaoIcon.tsx
│   │   └── NaverIcon.tsx
│   └── layout/                        # ✅ 구현 완료
│       ├── Sidebar.tsx                # 280px open / 64px collapsed, 모바일 오버레이
│       ├── Header.tsx                 # 모바일 햄버거, 테마 토글, 유저 아바타
│       └── ThemeInitializer.tsx       # 시스템 다크모드 감지, localStorage 지속
│
├── lib/
│   ├── api/
│   │   └── fetchClient.ts            # ✅ 인증 fetch 래퍼
│   │                                  #   - Authorization 헤더 자동 첨부
│   │                                  #   - 401 시 refresh → 재요청
│   │                                  #   - single-flight 패턴 (중복 refresh 방지)
│   │                                  #   - forceLogout (실패 시 /login 리다이렉트)
│   ├── auth/
│   │   └── oauthConfig.ts            # OAuth 프로바이더 설정
│   └── stores/
│       ├── index.ts                   # barrel export
│       ├── useAuthStore.ts            # 인증 상태 (user, accessToken, isAuthenticated)
│       └── useAppStore.ts             # 앱 상태 (theme, sidebarOpen)
│
├── middleware.ts                       # ✅ 인증 라우팅
│                                       #   - refresh_token 쿠키 기반
│                                       #   - 로그인 유저 → /main 리다이렉트
│                                       #   - 비로그인 유저 → /login 리다이렉트
│                                       #   - force=true → 쿠키 삭제
│
├── docs/
│   └── known-issues.md                # 알려진 이슈 목록
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
└── .env.local
```

---

## 🎨 스타일링 규칙

### Tailwind CSS 4 + CSS 변수 다크모드
```css
/* globals.css 구조 */
@import "tailwindcss";

:root { --background: #ffffff; --foreground: #111111; /* ... */ }
.dark { --background: #0f172a; --foreground: #e2e8f0; /* ... */ }

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* Tailwind에서 bg-background, text-foreground 등으로 사용 */
}
```

### 다크모드 적용 방식
- `ThemeInitializer`가 `<html>` 요소에 `dark` 클래스 토글
- 시스템 설정 자동 감지 (prefers-color-scheme)
- 사용자 수동 토글 시에만 localStorage 저장
- Tailwind: `dark:` 프리픽스 사용

### 커스텀 색상 사용
```tsx
// ✅ CSS 변수 기반 색상 사용
<div className="bg-background text-foreground" />
<div className="bg-sidebar-bg border-sidebar-border" />
<div className="text-muted" />
<div className="bg-accent hover:bg-accent-hover" />
```

---

## 🔐 인증 구조

### 토큰 관리
- Access Token: `sessionStorage` (authFetch가 자동 첨부)
- Refresh Token: `httpOnly 쿠키` (서버가 관리)
- 토큰 갱신: `fetchClient.ts`의 `getRefreshPromise()` (single-flight)

### 라우팅 보호
```
middleware.ts:
  / , /login, /callback/* → 로그인 시 /main으로 리다이렉트
  /main/*, /onboarding/*  → 비로그인 시 /login으로 리다이렉트

AuthGuard (컴포넌트):
  main/layout.tsx에서 사용
  access_token 없으면 refresh 시도 → 실패 시 /login
```

---

## 📝 코드 작성 규칙

### 컴포넌트 구조
```tsx
'use client'; // 클라이언트 컴포넌트만

import { useState } from 'react';

interface XxxProps {
  // Props 인터페이스 정의
}

export default function Xxx({ ... }: XxxProps) {
  // 상태, 이벤트 핸들러
  return ( /* JSX */ );
}
```

### Zustand 스토어 패턴
```tsx
import { create } from 'zustand';

interface XxxState {
  // 상태 + 액션 타입
}

export const useXxxStore = create<XxxState>((set) => ({
  // 초기값 + 액션
}));
```

### API 호출 패턴
```tsx
import { authFetch } from '@/lib/api/fetchClient';

// 인증 필요한 API
const res = await authFetch('/api/xxx');
const { data } = await res.json();

// 인증 불필요한 API
const res = await fetch('/api/xxx');
```

---

## ♿ 접근성

- 시맨틱 HTML 사용 (nav, main, aside 등)
- ARIA 레이블 (인터랙티브 요소)
- 키보드 네비게이션 지원
- 색상 대비 4.5:1 이상
- 알려진 이슈: `docs/known-issues.md` 참조

---

## 🚀 실행

```bash
npm run dev
# http://localhost:3000
# /main 접근 시 refresh_token 쿠키 필요 (소셜 로그인 후 자동 설정)
```

---

_Last Updated: 2026-03-15_

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
│   ├── api/                           # BFF Route Handlers ✅
│   │   ├── auth/
│   │   │   ├── callback/route.ts      # OAuth 콜백 → __session 쿠키 발급
│   │   │   ├── refresh/route.ts       # 토큰 갱신
│   │   │   ├── logout/route.ts        # 로그아웃 (쿠키 삭제)
│   │   │   ├── session/route.ts       # 세션 조회 (프로필 + 인증 상태)
│   │   │   └── oauth-state/route.ts   # OAuth state 쿠키 발급
│   │   └── proxy/
│   │       └── [...path]/route.ts     # 범용 인증 API 프록시
│   │
│   ├── main/                          # 메인 라우트 (AuthGuard 보호) ✅
│   │   ├── layout.tsx                 # 'use client' - Sidebar + Header + main
│   │   └── page.tsx                   # 대시보드
│   │
│   ├── layout.tsx                     # 루트 레이아웃 (ThemeInitializer, metadata)
│   ├── page.tsx                       # 랜딩 페이지
│   ├── globals.css                    # CSS 변수 + 다크모드 + @theme inline
│   └── icon.svg
│
├── components/
│   ├── auth/                          # ✅ 구현 완료
│   │   ├── AuthGuard.tsx              # 세션 검증 + 미인증 시 /login 리다이렉트
│   │   ├── SocialLoginButton.tsx
│   │   └── SocialLoginGroup.tsx
│   ├── common/
│   │   └── LoadingSpinner.tsx
│   ├── dashboard/                     # ✅ 구현 완료
│   │   ├── EmptyDashboard.tsx
│   │   └── CreateTripCard.tsx
│   ├── icons/                         # ✅ 구현 완료
│   │   ├── GoogleIcon.tsx
│   │   ├── KakaoIcon.tsx
│   │   ├── NaverIcon.tsx
│   │   └── TripIcons.tsx
│   └── layout/                        # ✅ 구현 완료
│       ├── Sidebar.tsx                # 260px open, 모바일 오버레이, 로그아웃 버튼
│       ├── Header.tsx                 # 모바일 햄버거, 테마 토글, 유저 아바타
│       └── ThemeInitializer.tsx       # 시스템 다크모드 감지, localStorage 지속
│
├── lib/
│   ├── api/
│   │   └── fetchClient.ts            # ✅ BFF 프록시 기반 fetch 래퍼
│   │                                  #   - /api/ → /api/proxy/ 변환 (BFF 경유)
│   │                                  #   - 쿠키 기반 인증 (credentials: 'include')
│   │                                  #   - 401 시 forceLogout
│   ├── auth/
│   │   └── oauthConfig.ts            # OAuth 프로바이더 설정
│   ├── server/                        # ✅ 서버 전용 유틸
│   │   ├── session.ts                 # AES-256-GCM __session 쿠키 암복호화
│   │   └── backendFetch.ts            # Spring API 호출 (JWT 첨부, 401 refresh)
│   └── stores/
│       ├── index.ts                   # barrel export
│       ├── useAuthStore.ts            # 인증 상태 (user, isAuthenticated, fetchSession)
│       └── useAppStore.ts             # 앱 상태 (theme, sidebarOpen)
│
├── middleware.ts                       # ✅ 인증 라우팅
│                                       #   - __session 쿠키 기반
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
└── .env.local                         # SESSION_SECRET (AES-256-GCM 키)
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

## 🔐 인증 구조 (BFF 패턴)

### 아키텍처
- 브라우저 → Next.js Route Handler (BFF) → Spring Boot
- JWT는 브라우저에 노출되지 않음 (XSS 방어)

### 토큰 관리
- Access Token: `__session` HttpOnly 쿠키 (AES-256-GCM 암호화, `lib/server/session.ts`)
- Refresh Token: `refresh_token` HttpOnly 쿠키 (Spring이 관리)
- 토큰 갱신: 서버 측에서 투명하게 처리 (`lib/server/backendFetch.ts`)

### BFF Route Handlers
```
POST /api/auth/callback      → OAuth 인증 후 __session 쿠키 발급
POST /api/auth/refresh        → 토큰 갱신
POST /api/auth/logout         → 쿠키 삭제
GET  /api/auth/session        → 세션 검증 + 프로필 조회
POST /api/auth/oauth-state    → OAuth state 쿠키 발급
ANY  /api/proxy/[...path]     → 범용 인증 API 프록시
```

### 라우팅 보호
```
middleware.ts:
  / , /login           → 로그인(__session 있음) 시 /main으로 리다이렉트
  /main/*, /onboarding/*  → 비로그인 시 /login으로 리다이렉트

AuthGuard (컴포넌트):
  main/layout.tsx에서 사용
  fetchSession() 호출 → 미인증 시 /login 리다이렉트
```

### Set-Cookie 주의사항
- Route Handler에서 `response.cookies` API와 `response.headers.append('Set-Cookie', ...)`를 혼용하면 안됨
- Next.js의 `response.cookies`가 수동 추가한 Set-Cookie 헤더를 덮어쓰는 버그 있음
- 여러 쿠키를 설정하는 Route Handler에서는 `response.headers.append`만 사용할 것

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

// 인증 필요한 API (자동으로 /api/proxy/xxx로 변환되어 BFF 경유)
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
# /main 접근 시 __session 쿠키 필요 (소셜 로그인 후 BFF가 자동 설정)
# SESSION_SECRET 환경변수 필요 (.env.local)
```

---

_Last Updated: 2026-03-15_

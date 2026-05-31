# shg-trip-front

> Claude AI로 여행 일정을 자동 생성해주는 서비스의 Next.js 프론트엔드.
> 목적지, 테마, 예산만 입력하면 AI가 최적 동선과 차선책까지 포함한 일정을 만들어줍니다.

<!-- 스크린샷: 추후 추가 예정 -->
<!-- ![데모](docs/screenshot.png) -->

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 19.2.3 |
| Styling | Tailwind CSS 4 (CSS 변수 기반 다크모드) |
| State | Zustand 5.0.11 |
| Map | Leaflet / react-leaflet |
| DnD | @dnd-kit/core + sortable |

## 구현 현황

| 영역 | 상태 | 비고 |
|------|------|------|
| 소셜 로그인 / 온보딩 | ✅ 완료 | |
| BFF 인증 레이어 | ✅ 완료 | |
| 메인 레이아웃 (Sidebar / Header) | ✅ 완료 | |
| 일정 생성 위자드 | ✅ 완료 | |
| 일정 결과 뷰 (타임라인 + 지도) | ✅ 완료 | |
| 내 일정함 | ✅ 완료 | Mock 데이터 사용 중 |
| 일정 편집 UI | ✅ 완료 | Mock 데이터 사용 중 |
| 백엔드 API 실연동 | 📋 예정 | itineraryService.ts 교체 필요 |
| 커스터마이징 / 공유 UI | 📋 예정 | |

> 현재 일정 관련 데이터는 `lib/mock/`의 Mock 데이터를 사용합니다.
> 백엔드 연동 시 `lib/data/itineraryService.ts`를 교체하면 됩니다.

## 아키텍처 — BFF 패턴

```
Browser (httpOnly 쿠키)
  ↕
Next.js Route Handlers (BFF)   ← __session 쿠키 (AES-256-GCM 암호화된 accessToken)
  ↕ Authorization: Bearer
Spring Boot API
```

JWT는 브라우저에 직접 노출되지 않습니다. 모든 인증 API 호출은 `/api/proxy/[...path]`를 통해 BFF가 토큰을 자동 주입합니다.

## 프로젝트 구조

```
app/
├── (auth)/          # 로그인, 온보딩, OAuth 콜백
├── api/
│   ├── auth/        # BFF: callback, refresh, logout, session, oauth-state
│   └── proxy/       # 범용 인증 API 프록시
└── main/            # 대시보드, 일정 생성/결과/편집, 내 일정함

components/
├── auth/            # AuthGuard, SocialLoginButton
├── itinerary/       # 위자드, 결과 레이아웃, 지도 패널
└── layout/          # Sidebar, Header, ThemeInitializer

lib/
├── api/fetchClient.ts      # authFetch (BFF 프록시 래퍼)
├── mock/                   # Mock 데이터 (itineraries, places) — 임시
├── server/session.ts       # AES-256-GCM 세션 쿠키 암복호화
├── server/backendFetch.ts  # 서버사이드 Spring 호출
└── stores/                 # useAuthStore, useAppStore, useItineraryStore, useWizardStore
```

## 실행

### 사전 요구사항

- Node.js 20+
- 백엔드 서버 실행 중 (`http://localhost:8080`)

### 환경변수 설정

```bash
cp .env.local.example .env.local  # 없으면 직접 생성
```

```env
SESSION_SECRET=          # AES-256-GCM 32바이트 키 (hex, 64자)
NEXT_PUBLIC_API_URL=     # Spring Boot URL (기본값: http://localhost:8080)
```

`SESSION_SECRET` 생성:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 서버 시작

```bash
npm install
npm run dev
```

서버: `http://localhost:3000`

> `/main` 접근 시 `__session` 쿠키가 필요합니다. 소셜 로그인 후 BFF가 자동으로 설정합니다.

## 인증 흐름

1. `/login` → 소셜 로그인 버튼 → OAuth Provider 리다이렉트
2. `/callback/[provider]` → 인가코드 수신 → `POST /api/auth/callback`
3. BFF → Spring에 코드 전달 → JWT 수신 → `__session` HttpOnly 쿠키 설정
4. 이후 API 호출: `authFetch('/api/xxx')` → `/api/proxy/xxx` → BFF가 토큰 자동 주입
5. 401 응답 시 BFF가 `refresh_token`으로 자동 갱신 후 재시도

## 라우트 보호

`middleware.ts`가 `__session` 쿠키 존재 여부로 라우팅을 제어합니다.

| 상황 | 동작 |
|------|------|
| 비인증 → `/main` 접근 | `/login` 리다이렉트 |
| 인증 → `/login` 접근 | `/main` 리다이렉트 |
| `?force=true` | 강제 로그아웃 (쿠키 삭제) |

## 개발 가이드

### 브랜치 전략

```
main        # 배포 브랜치
develop     # 통합 브랜치
feature/*   # 기능 개발
fix/*       # 버그 수정
```

### API 호출 패턴

```ts
import { authFetch } from '@/lib/api/fetchClient';

// 인증 필요 (자동으로 BFF 프록시 경유)
const res = await authFetch('/api/users/me');
const { data } = await res.json();

// 인증 불필요
const res = await fetch('/api/shared/token123');
```

### 새 페이지 추가 시 체크리스트

- [ ] `app/main/` 하위에 추가 (AuthGuard 자동 적용)
- [ ] 서버 컴포넌트 기본, 인터랙션 필요 시만 `'use client'`
- [ ] Mock 데이터 사용 시 `lib/mock/`에 추가하고 `itineraryService.ts`에서 분기

### 스타일링

Tailwind CSS 4 + CSS 변수 기반 다크모드. 색상은 반드시 CSS 변수 클래스 사용:

```tsx
// ✅
<div className="bg-background text-foreground" />
<div className="bg-sidebar-bg border-sidebar-border text-muted" />

// ❌ 하드코딩 금지
<div className="bg-white text-gray-900" />
```

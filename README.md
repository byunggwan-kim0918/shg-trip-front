# shg-trip-front

> Claude AI로 여행 일정을 만들어주는 서비스(shg-trip)의 Next.js 프론트엔드.
> 목적지·기간·테마·예산을 입력하면 AI가 동선과 차선책까지 포함한 일정을 생성하고, 사용자는 이를 편집·확정·공유할 수 있습니다.

<!-- 스크린샷 자리 (추후 추가): docs/screenshot.png -->

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 |
| UI | React 19.2.3 |
| Styling | Tailwind CSS 4 (CSS 변수 기반 다크모드) |
| State | Zustand 5.0.11 |
| Map | @vis.gl/react-google-maps (Google Maps) |
| Drag & Drop | @dnd-kit (core / sortable / utilities) |
| Icons | lucide-react |
| E2E Test | Playwright |

## 주요 기능

- **자연어로 일정 요청** — "3월에 오사카 2박 3일, 미식 위주로" 같은 문장을 입력하면 백엔드가 목적지·기간·테마 등 구조화된 필드로 파싱해 마법사에 채워줍니다.
- **AI 일정 생성 (실시간 스트리밍)** — 생성이 진행되는 동안 Day 카드가 SSE로 실시간 렌더링됩니다. 완성된 일정은 타임라인과 Google 지도로 함께 확인할 수 있습니다.
- **일정 편집** — 같은 날짜 안에서 방문지를 드래그로 재정렬하거나 개별 스톱을 삭제할 수 있습니다.
- **내 일정함 / 상세 보기** — 생성한 일정을 목록에서 관리하고, 제목·태그를 수정하며, 일정을 확정(finalize)할 수 있습니다.
- **공유** — 공유 링크를 만들면 로그인 없이 볼 수 있는 공개 페이지(`/shared/[token]`)가 열립니다.
- **소셜 로그인** — Kakao / Google / Naver OAuth 로그인 및 온보딩(닉네임 설정).

## 아키텍처 — BFF 패턴

```
Browser (HttpOnly 쿠키)
  ↕
Next.js Route Handlers (BFF)   ← __session 쿠키 (AES-256-GCM으로 암호화된 accessToken)
  ↕ Authorization: Bearer
Spring Boot API (:8080)
```

JWT는 브라우저 JS에 직접 노출되지 않습니다. 클라이언트의 인증 API 호출은 모두 `/api/proxy/[...path]`를 거치며, BFF(Route Handler)가 세션 쿠키를 복호화해 백엔드 요청에 토큰을 주입합니다. 401이 나면 BFF가 refresh 토큰으로 자동 갱신 후 재시도합니다.

## 프로젝트 구조

```
app/
├── (auth)/                # login, onboarding, callback/[provider]
├── api/
│   ├── auth/              # BFF: callback, refresh, logout, session, oauth-state
│   └── proxy/[...path]/   # 범용 인증 API 프록시
├── main/                  # AuthGuard 보호 영역
│   ├── page.tsx           # 대시보드
│   ├── plan/new/          # 일정 생성 마법사
│   ├── my-trips/          # 내 일정함
│   └── itinerary/         # [id] 상세, loading 스트리밍
├── shared/[token]/        # 공유 일정 공개 페이지 (비인증)
├── health/                # 헬스체크 (route)
└── page.tsx               # 랜딩

components/
├── auth/                  # AuthGuard, 소셜 로그인
├── layout/                # Sidebar, Header, HeaderSearch, AvatarMenu, ThemeInitializer
└── itinerary/             # 마법사, 결과 타임라인, 지도 패널, 편집 UI

lib/
├── api/fetchClient.ts     # authFetch (BFF 프록시 래퍼)
├── data/itineraryService.ts   # 일정 관련 백엔드 API 호출 (authFetch 기반)
├── server/session.ts      # AES-256-GCM 세션 쿠키 암복호화
├── server/backendFetch.ts # 서버사이드 Spring 호출 (BACKEND_URL)
└── stores/                # Zustand: useAuthStore, useAppStore, useItineraryStore, useWizardStore

e2e/                       # Playwright E2E 테스트
```

## 로컬 실행

### 요구사항

- Node.js 20+
- Spring Boot 백엔드 실행 중 (기본 `http://localhost:8080`) — [../CLAUDE.md](../CLAUDE.md) 참고

### 환경변수

저장소에 `.env.local.example`은 없습니다. 프로젝트 루트에 `.env.local`을 직접 만들고 아래 키를 채우세요. **값은 비밀이므로 커밋하지 마세요.**

서버 전용 (브라우저에 노출 안 됨):

| 키 | 설명 |
|----|------|
| `SESSION_SECRET` | 세션 쿠키 암복호화용 AES-256-GCM 키 (32바이트 = hex 64자) |
| `BACKEND_URL` | Spring Boot 백엔드 URL (미설정 시 `http://localhost:8080`) |

브라우저 노출 (`NEXT_PUBLIC_`):

| 키 | 설명 |
|----|------|
| `NEXT_PUBLIC_APP_URL` | 프론트 자체 URL. OAuth redirect URI 조합에 사용 (미설정 시 `http://localhost:3000`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | Kakao OAuth 클라이언트 ID (REST API 키) |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | Naver OAuth 클라이언트 ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 결과 화면 지도 렌더링용 Google Maps JavaScript API 키 |
| `NEXT_PUBLIC_DEMO_MODE` | `true`면 AuthGuard 인증을 우회 (기본 `false`) |

`SESSION_SECRET` 생성:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 실행

```bash
npm install
npm run dev      # 개발 서버 → http://localhost:3000
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
npm run lint     # ESLint
```

E2E 테스트 (Playwright):

```bash
npm run e2e        # 생성(@generation) 제외한 E2E 실행
npm run e2e:full   # 전체 실행 (생성 포함, 백엔드 필요)
npm run e2e:gen    # 생성(@generation)만 실행
npm run e2e:report # 마지막 리포트 열기
```

> 세부 사항은 [e2e/README.md](e2e/README.md) 참고.

## 인증 / 라우팅 / API 호출

### 인증 흐름

1. `/login` → 소셜 로그인 버튼 → OAuth Provider로 리다이렉트
2. `/callback/[provider]` → 인가코드 수신 → `POST /api/auth/callback`
3. BFF가 코드를 백엔드로 전달 → JWT 수신 → `__session` HttpOnly 쿠키로 암호화 저장
4. 이후 인증 API 호출은 `authFetch` → `/api/proxy/...` 경유, BFF가 토큰 주입
5. 401 시 BFF가 refresh 토큰으로 갱신 후 재시도
6. 닉네임 미설정 사용자는 `/onboarding`으로 유도

### 라우트 보호

`/main` 이하는 클라이언트 `AuthGuard`가 세션을 검증합니다. `middleware.ts`는 `__session` 쿠키 유무로 라우팅을 제어합니다.

| 상황 | 동작 |
|------|------|
| 비인증 → `/main` 접근 | `/login` 리다이렉트 |
| 인증 → `/login` 접근 | `/main` 리다이렉트 |
| `NEXT_PUBLIC_DEMO_MODE=true` | AuthGuard 인증 우회 (개발용) |

### API 호출 패턴

```ts
import { authFetch } from '@/lib/api/fetchClient';

// 인증 필요 — BFF 프록시를 자동 경유
const res = await authFetch('/api/itineraries?page=0&size=10');
const { data } = await res.json();

// 비인증 리소스 (예: 공유 페이지)
const res = await fetch('/api/shared/token123');
```

## 개발 가이드

### 스타일링

Tailwind CSS 4 + CSS 변수 기반 다크모드. 색상은 하드코딩하지 말고 CSS 변수 클래스를 사용하세요.

```tsx
// ✅
<div className="bg-background text-foreground" />

// ❌ 하드코딩 금지
<div className="bg-white text-gray-900" />
```

### 새 페이지 추가

- 인증이 필요한 화면은 `app/main/` 하위에 추가하면 `AuthGuard`가 자동 적용됩니다.
- 서버 컴포넌트를 기본으로, 인터랙션이 필요할 때만 `'use client'`를 사용합니다.
- 일정 관련 데이터 접근은 `lib/data/itineraryService.ts`의 함수를 사용합니다 (직접 fetch 지양).

### 추가 문서

- 프론트엔드 상세 컨텍스트: [CLAUDE_FRONTEND.md](CLAUDE_FRONTEND.md)
- 프로젝트 공통 규칙·백엔드·실행: [../CLAUDE.md](../CLAUDE.md)
- 알려진 이슈: [docs/known-issues.md](docs/known-issues.md)

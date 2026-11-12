# AGENTS.md

shg-trip 웹 프론트엔드(Next.js 16 App Router). 서비스 개요는 [README.md](README.md)에 있고, 로컬 실행은 아래 명령을 따른다. 설명과 커밋 메시지는 한국어로 쓰고, 코드·식별자는 영어로 쓴다.

## 명령

```bash
npm run dev                 # predev가 maplibre 워커를 public/으로 복사한다
npx tsc --noEmit            # PR CI 1단계
npm run lint                # PR CI 2단계
npm run build               # PR CI 3단계
npm run e2e                 # LLM 호출 없는 E2E
npm run e2e:haiku           # 대화 해석(Haiku) 포함, 비용 발생
npm run e2e:gen             # 일정 생성 포함, 백엔드와 비용 필요
```

변경 후에는 CI 3단계를 모두 통과시킨다. `e2e:haiku`·`e2e:gen`은 비용이 들어 요청받았을 때만 돌린다.

로컬 실행에는 백엔드(`http://localhost:8080`)와 `.env.local`이 필요하다.

| 키 | 내용 |
|---|---|
| `SESSION_SECRET` | 세션 쿠키 AES-256-GCM 키, 32바이트 hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `BACKEND_URL` | 백엔드 주소, 기본 `http://localhost:8080` |
| `NEXT_PUBLIC_APP_URL` | 이 앱 주소, 로컬은 `http://localhost:3000` |
| `NEXT_PUBLIC_{KAKAO,GOOGLE,NAVER}_CLIENT_ID` | OAuth 클라이언트 ID |
| `NEXT_PUBLIC_DEMO_MODE` | `true`면 AuthGuard를 건너뛴다 (로컬 전용) |
| `ASSET_PREFIX` | 빌드 인자. 정적 파일 CDN 주소, 비우면 앱 서버가 직접 내보낸다 |

## 구조

- `app/app/**`: 로그인 영역. `AuthGuard`가 보호하고, 경로 문자열은 `lib/routes.ts`의 `ROUTES`로만 만든다.
- `app/trips/**`: 공개 추천 코스. `content/trips/{region}/*.json`에서 정적 생성하고 `dynamicParams = false`다.
- `app/api/auth/**`, `app/api/proxy/[...path]`: BFF. 백엔드 JWT를 쥐는 유일한 곳이다.
- `lib/server/**`: 서버 전용(세션 암복호화, 백엔드 호출과 401 refresh). 클라이언트 컴포넌트에서 import하지 않는다.
- `lib/trips/content.ts`: `node:fs`를 쓴다. 클라이언트 컴포넌트에서 import하면 빌드가 깨진다.

## 규칙

- 백엔드 호출은 `authFetch`(`lib/api/fetchClient.ts`)나 `lib/data/itineraryService.ts`를 쓴다. 클라이언트 코드는 토큰과 refresh를 다루지 않는다.
- 색은 `app/globals.css` 토큰 클래스(`bg-background`, `text-foreground`, `text-muted`, `bg-accent` 등)만 쓴다. Tailwind `dark:` 변형은 쓰지 않는다. 토큰은 `.dark` 클래스를 따르고 `dark:`는 OS 설정을 따라서 둘이 어긋난다.
- 서버 컴포넌트가 기본이고, 상호작용이 필요할 때만 `'use client'`를 붙인다.
- 새 화면은 [docs/design-dna.md](docs/design-dna.md)의 팔레트·모션·형태 기준을 따른다.
- `NEXT_PUBLIC_*` 운영값은 커밋된 `.env.production`에서 빌드 때 들어간다. 비밀값은 넣지 않는다.

## 함정

- Route Handler에서 `response.cookies`와 `response.headers.append('Set-Cookie', ...)`를 섞지 않는다. `response.cookies`가 수동으로 붙인 Set-Cookie를 덮어쓴다. 여러 쿠키는 `headers.append`로만 붙인다.
- 지도 베이스맵은 maplibre 워커를 `public/`에 복사하고 `setWorkerUrl`로 고정해야 그려진다. 빠지면 마커는 보이고 베이스맵만 백지가 된다.
- 타일은 OpenFreeMap만 쓴다. CARTO는 키 없이 호출하면 HTTP 200으로 워터마크 타일을 줘서 오류 없이 지도가 회색이 된다. 어트리뷰션 표기는 필수다.
- 배포 워크플로의 S3 업로드는 ECS 배포보다 먼저 돌아야 하고 `--delete`를 붙이지 않는다. 이전 빌드 청크가 지워지면 열려 있던 탭이 깨진다.
- 루트 에러 화면(`app/global-error.tsx`)은 자체 `<html>`·`<body>`를 그리고, 청크 로딩 실패일 때만 10초 쿨다운으로 한 번 새로고침한다.

## 주석

- 코드만 봐서는 알 수 없는 이유만 현재형 한두 문장으로 남긴다. 이 코드가 없으면 무엇이 틀리는지를 쓴다.
- 코드를 말로 옮긴 것, 작업 경위·과거 사건·실측 서술, 대시(—)로 문장을 잇는 것은 쓰지 않는다.

## 커밋

- 커밋과 푸시는 사람이 한다. 에이전트는 브랜치 작업과 커밋 메시지 초안까지만 한다.
- 제목은 `type: 무엇 + 무엇 수정|추가|전환|제거`(`feat` `fix` `refactor` `chore` `docs`), 본문은 `- `로 시작하는 명사형 bullet이다.

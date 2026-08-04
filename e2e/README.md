# E2E (Playwright)

사용자 관점 브라우저 검증. OAuth 로그인은 자동화가 불가하므로, 로컬 시크릿으로 `__session`
쿠키를 위조해(→ `e2e/fixtures/session.ts`) 실제 로그인 유저처럼 동작한다.

## 전제 조건
- 백엔드 실행 중: `cd shg-trip-back && docker compose up -d && ./gradlew bootRun` (:8080)
- 프론트 실행 중: `npm run dev` (:3000)
- 시크릿 존재:
  - `shg-trip-front/.env.local` → `SESSION_SECRET` (64 hex)
  - `shg-trip-back/.env` → `JWT_SECRET`
  - (또는 동일 이름 환경변수로 주입. 경로 재지정: `BACK_ENV_PATH`)
- 대상 유저: `E2E_USER_ID` (기본 1). 해당 유저가 DB에 존재해야 함.

## 실행
```bash
npm run e2e         # 기본 — 생성/변형 없는 안전 검증 (실데이터 무변경, 생성 쿼터 소모 X)
npm run e2e:full    # 생성 포함 전체 플로우 (스로어웨이 자동 생성 → 검증 → 자동 삭제)
npm run e2e:gen     # @generation 플로우만
npm run e2e:report  # 마지막 HTML 리포트 열기
npx playwright test --ui   # 인터랙티브 UI 모드
```

## 구성
| 파일 | 내용 | 변형 |
|---|---|---|
| `tests/public.spec.ts` | 랜딩·로그인·보호라우팅 가드 | 없음 |
| `tests/dashboard.spec.ts` | 대시보드·테마·검색·아바타·목록 | 없음 |
| `tests/itinerary-detail.spec.ts` | 상세 렌더·Day탭·대안 펼침·카드 메뉴 | 없음(읽기 전용) |
| `tests/full-flow.spec.ts` `@generation` | 생성→대안선택→편집→공유→확정→스톱삭제 | 스로어웨이만, 자동 삭제 |

## 주의
- `full-flow`는 실제 Claude 호출로 일정을 생성한다(비용 + 30일 쿼터 5회 소모). 기본 `e2e`에서는
  `--grep-invert @generation`으로 제외된다.
- 시크릿은 런타임에 파일/환경변수에서 읽으며 저장소에 커밋되지 않는다.

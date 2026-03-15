# Known Issues

## Task 3 검증 후 발견된 이슈

### [Minor] Sidebar role 부적절
- 파일: `components/layout/Sidebar.tsx`
- `role="complementary"` → `role="navigation"`으로 변경 필요
- 내 일정함 네비게이션 용도이므로 navigation이 더 적절

### [Minor] Header 유저 아바타 접근성 미완성
- 파일: `components/layout/Header.tsx`
- `div`에 `role="button"` 있지만 클릭 핸들러, onKeyDown 없음
- 드롭다운 메뉴 구현 시 함께 수정

### [Info] main/layout.tsx가 'use client'
- 파일: `app/main/layout.tsx`
- Sidebar/Header가 클라이언트 컴포넌트라 불가피
- main 라우트 그룹에 별도 metadata 필요 시 layout 분리 검토

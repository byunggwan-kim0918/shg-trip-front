# 프론트엔드 API 연동 작업 목록

> 작성일: 2026-04-11
> 백엔드 API 연동 완료 기준으로 작성. BFF 인증 레이어(OAuth/세션/토큰 갱신)는 이미 완료.

---

## 기존 확인된 작업 (5개)

### 1. `lib/types/itinerary.ts` — 백엔드 응답 구조에 맞게 타입 수정

| 프론트 현재 | 백엔드 실제 |
|---|---|
| `days: DayPlan[]` | `steps: ItineraryStep[]` (days 없음, `dayNumber` 필드로 구분) |
| `Place.id: string` | `Place.id: number (Long)` |
| `ItineraryStep.alternatives: Alternative[]` | `alternatives: AlternativeOptionResponse[]` |
| `status: 'in_progress' \| 'confirmed'` | `status: 'DRAFT' \| 'FINALIZED' \| 'ARCHIVED'` |
| `TransportType: 'walk' \| 'bus' \| 'subway'` | `WALK \| CAR \| BUS \| TRAIN \| TAXI \| BIKE \| FLIGHT` |

---

### 2. `lib/data/itineraryService.ts` — Mock → 실제 API 교체

```
generateItinerary → POST /api/itineraries/generate (jobId 반환)
                    → GET  /api/itineraries/generate/{jobId}/stream (SSE 스트림 연결)
getItineraries   → GET  /api/itineraries
getItinerary     → GET  /api/itineraries/{id}
searchPlaces     → GET  /api/places/search?keyword={query}
```

`generateItinerary`는 단순 POST가 아니라 **jobId 받고 → SSE 스트림 연결**하는 2단계 구조.

---

### 3. `components/itinerary/LoadingScreen.tsx` — SSE 실제 연동

현재 `mockItineraryService.generateItinerary()` 호출 후 가짜 progress 시뮬레이션 중.
백엔드 SSE 이벤트(`progress`, `complete`, `error`)를 실제로 수신하도록 교체 필요.

SSE 이벤트 구조:
```
progress → { percentage: number, message: string, stage: string }
complete → { itineraryId: number }
error    → { message: string }
```

---

### 4. `lib/stores/useItineraryStore.ts` — Mock 의존성 제거

`loadItineraries()`가 `mockItineraryService`를 직접 호출 중. 실제 API 서비스로 교체 필요.

---

### 5. `components/itinerary/wizard/steps/PlaceSelectStep.tsx` — 장소 검색 연동

`mockItineraryService.searchPlaces()` → `GET /api/places/search?keyword=` 로 교체.

---

## 추가로 발견된 작업 (7개)

### 6. `lib/stores/useItineraryStore.ts` — 대안 선택이 백엔드에 저장 안 됨 🔴

`replaceStep()`이 메모리만 업데이트. 새로고침 시 선택이 사라짐.

백엔드에 전용 엔드포인트 구현 완료:
```
PATCH /api/itineraries/{id}/steps/{stepId}/select-alternative
Body: { alternativeId: number }
응답: ItineraryResponse (전체 일정 반환)
```

`replaceStep()` 호출 시 위 API를 함께 호출하도록 수정 필요.

---

### 7. `lib/stores/useItineraryStore.ts` — 드래그앤드롭 순서 변경이 백엔드에 저장 안 됨 🔴

`reorderSteps()`도 메모리만 변경. 새로고침 시 순서 원복.

필요한 API 호출:
```
PUT /api/itineraries/{id}   # 일정 수정 (스펙 명시 엔드포인트)
```

> ⚠️ 현재 스펙에 순서 변경 전용 API 없음. `PUT /api/itineraries/{id}` 의 request body 상세 스펙 확인 필요. 백엔드 담당자와 step 순서 포함 여부 협의 필요.

---

### 8. `components/itinerary/result/TimelinePanel.tsx` + `ResultLayout.tsx` — `days[]` 구조 의존 🔴

`itinerary.days[selectedDay].steps`, `itinerary.days[selectedDay].transits` 직접 접근 중.
백엔드는 `days` 없이 `steps[]`에 `dayNumber` 필드로 구분하는 구조.

타입 수정만으로는 부족하고, **`steps[]`를 `dayNumber` 기준으로 그루핑하는 변환 유틸** 필요:
```typescript
// 예시
function groupStepsByDay(steps: BackendStep[]): DayPlan[] { ... }
```

---

### 9. `components/itinerary/result/TransitInfo.tsx` — Transit 타입 구조 불일치

현재 `Transit: { from, to, type, duration }` 별도 객체 구조.
백엔드는 `transportationMode`, `transportationDuration`, `transportationDistance`, `transportationCost`가 각 step에 내장.

`Transit` 타입 제거 후 step 내부 필드로 처리하도록 컴포넌트 수정 필요.

---

### 10. `components/itinerary/list/ItineraryList.tsx` — status 라벨 불일치

```typescript
// 현재 (동작 안 함)
STATUS_LABELS = { in_progress: '진행 중', confirmed: '확정' }

// 백엔드 실제 값
'DRAFT' | 'FINALIZED' | 'ARCHIVED'
```

`DRAFT` 매핑 없어서 라벨이 빈 문자열로 표시됨.

수정:
```typescript
STATUS_LABELS = { DRAFT: '초안', FINALIZED: '확정', ARCHIVED: '보관' }
```

---

### 11. `components/itinerary/wizard/steps/SummaryStep.tsx` — WizardData → Request 변환 누락

`handleGenerate()`가 라우팅만 하고 데이터를 전달하지 않음.
`LoadingScreen`이 `useWizardStore`에서 `data`를 읽지만, 백엔드 `ItineraryGenerateRequest` 형식으로 변환 필요.

특히 `selectedPlaces: Place[]` → `selectedPlaceIds: number[]` 변환 필수:
```typescript
selectedPlaceIds: data.selectedPlaces.map((p) => Number(p.id))
```

---

### 12. `components/itinerary/wizard/steps/PlaceSelectStep.tsx` — Place.id 타입 불일치

백엔드 장소 ID는 `number (Long)`인데 프론트 `Place.id`는 `string`.
Manual Mode에서 선택한 장소를 `selectedPlaceIds: number[]`로 보낼 때 변환 없이 보내면 타입 오류.

---

## 작업 안 해도 되는 것

- `lib/api/fetchClient.ts` — 이미 완성
- `app/api/proxy/[...path]/route.ts` — 이미 완성
- `lib/stores/useWizardStore.ts` — 위자드 로직은 프론트 전용
- `lib/mock/` 폴더 — 연동 완료 후 삭제

---

## 권장 작업 순서

1. `lib/types/itinerary.ts` 백엔드 응답 구조에 맞게 수정
2. `steps[]` → `days[]` 그루핑 변환 유틸 작성
3. `lib/data/itineraryService.ts` 실제 API 클라이언트로 교체
4. `LoadingScreen.tsx` SSE 연동
5. `useItineraryStore.ts` Mock 제거 + 대안 선택/순서 변경 API 연동
6. `ItineraryList.tsx` status 라벨 수정
7. `SummaryStep.tsx` WizardData → Request 변환 추가
8. `PlaceSelectStep.tsx` 장소 검색 연동 + id 타입 처리
9. `TimelinePanel.tsx` / `TransitInfo.tsx` 구조 변경에 맞게 수정
10. `lib/mock/` 폴더 삭제

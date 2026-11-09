'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWizardStore, MAX_TASTE_SELECTIONS } from '@/lib/stores/useWizardStore';
import {
  NEW_TRIP_SENTENCE_KEY, NEW_TRIP_PARSED_KEY, DESCRIPTION_MAX_LENGTH, DESTINATION_MAX_LENGTH,
} from '@/lib/constants/newTrip';
import { parseTripSentence, type ParsedTrip } from '@/lib/data/itineraryService';
import type { WizardData, Theme, Category, TripPace, TransportPref, Companion } from '@/lib/types/itinerary';
import NewTripShell from '@/components/itinerary/NewTripShell';
import WizardLayout from '@/components/itinerary/wizard/WizardLayout';
import TripBasicsStep from '@/components/itinerary/wizard/steps/TripBasicsStep';
import TasteStep from '@/components/itinerary/wizard/steps/TasteStep';
import StyleStep from '@/components/itinerary/wizard/steps/StyleStep';
import BudgetPlacesStep from '@/components/itinerary/wizard/steps/BudgetPlacesStep';
import ConfirmStep from '@/components/itinerary/wizard/steps/ConfirmStep';

/** 문장에 카테고리 키워드가 없을 때 테마로 카테고리를 채운다. */
const THEME_DEFAULT_CATEGORIES: Record<string, Category[]> = {
  food: ['restaurant', 'cafe', 'street_food'],
  healing: ['cafe', 'nature', 'attraction'],
  romance: ['restaurant', 'cafe', 'viewpoint'],
  nature: ['nature', 'trail', 'viewpoint'],
  ocean: ['beach', 'viewpoint', 'restaurant'],
  mountain: ['trail', 'nature', 'viewpoint'],
  culture: ['museum', 'temple', 'attraction'],
  art: ['museum', 'attraction', 'cafe'],
  shopping: ['shopping', 'market', 'cafe'],
  activity: ['experience', 'attraction', 'restaurant'],
  adventure: ['experience', 'trail', 'attraction'],
  family: ['theme_park', 'attraction', 'restaurant'],
  nightview: ['viewpoint', 'nightlife', 'restaurant'],
  photo: ['viewpoint', 'attraction', 'cafe'],
  walking: ['trail', 'attraction', 'cafe'],
  local: ['market', 'street_food', 'restaurant'],
  festival: ['attraction', 'experience', 'restaurant'],
  luxury: ['restaurant', 'spa', 'attraction'],
  budget: ['attraction', 'street_food', 'market'],
  pet: ['cafe', 'nature', 'attraction'],
};
const DEFAULT_CATEGORIES: Category[] = ['attraction', 'restaurant', 'cafe'];

function deriveCategories(themes: Theme[]): Category[] {
  const set = new Set<Category>();
  for (const t of themes) for (const c of THEME_DEFAULT_CATEGORIES[t] ?? []) set.add(c);
  const derived = Array.from(set).slice(0, 4);
  return derived.length > 0 ? derived : DEFAULT_CATEGORIES;
}

function applyPrefill(sentence: string, parsed: ParsedTrip | null) {
  // 랜딩·대시보드 입력창은 길이 제한이 없어 서버 상한보다 긴 문장이 넘어올 수 있다.
  const partial: Partial<WizardData> = { description: sentence.slice(0, DESCRIPTION_MAX_LENGTH) };
  if (parsed) {
    if (parsed.destination) partial.destination = parsed.destination.slice(0, DESTINATION_MAX_LENGTH);
    if (parsed.startDate) partial.startDate = parsed.startDate;
    if (parsed.endDate) partial.endDate = parsed.endDate;
    if (parsed.themes?.length) partial.themes = (parsed.themes as Theme[]).slice(0, MAX_TASTE_SELECTIONS);
    if (parsed.categories?.length) {
      partial.categories = (parsed.categories as Category[]).slice(0, MAX_TASTE_SELECTIONS);
    }
    if (parsed.pace) partial.pace = parsed.pace as TripPace;
    if (parsed.transportPref) partial.transportPref = parsed.transportPref as TransportPref;
    if (parsed.budget != null) partial.budget = parsed.budget;
    if (parsed.companion) partial.companion = parsed.companion as Companion;
    // 혼자·커플은 인원 입력이 숨겨져 있어, 앞뒤 안 맞는 인원이 보이지 않은 채 전송된다
    if (parsed.partySize != null && parsed.companion !== 'solo' && parsed.companion !== 'couple') {
      partial.partySize = parsed.partySize;
    }
    if (parsed.arrivalTime) partial.arrivalTime = parsed.arrivalTime;
    if (parsed.departureTime) partial.departureTime = parsed.departureTime;
  }
  useWizardStore.getState().updateData(partial);

  // 테마를 못 읽었으면 기본 테마를 넣지 않고 취향 단계로 보낸다.
  // 넣으면 사용자가 고르지 않은 테마가 요약에 고른 것처럼 보인다.
  const d = useWizardStore.getState().data;
  if (d.destination && d.startDate && d.endDate) {
    if (d.themes.length === 0) {
      useWizardStore.getState().setStep(1);
      return;
    }
    if (d.categories.length === 0) {
      useWizardStore.getState().updateData({ categories: deriveCategories(d.themes) });
    }
    useWizardStore.getState().setStep(4);
  }
}

let reloadChecked = false;

/** 이 문서를 마법사 주소에서 새로고침해 열었는지. 같은 문서 안에서 다시 들어오는 건 새 여행으로 본다. */
function isWizardReload(): boolean {
  if (reloadChecked) return false;
  reloadChecked = true;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type !== 'reload') return false;
  const url = new URL(nav.name);
  return url.pathname === '/main/plan/new' && url.searchParams.get('builder') === '1';
}

/**
 * - `?builder=1` 없음 → NewTripShell(자연어 입력 + 실시간 파싱).
 * - `?builder=1` → 5단계 마법사. 파싱 결과 프리필 + ConfirmStep 점프.
 */
export default function PlanNewPage() {
  const searchParams = useSearchParams();
  const builder = searchParams.get('builder') === '1';
  // LoadingScreen 에러의 "조건 수정"은 기존 입력을 보존한 채 지정 단계로 돌아온다.
  const stepParam = searchParams.get('step');
  const { reset } = useWizardStore();
  // StrictMode(dev) 이중 실행에서 2회차가 프리필을 지우지 않게 한 번만 소비한다.
  const didInit = useRef(false);
  // 단계 컴포넌트는 달력 달·시간 펼침 같은 상태를 마운트 때 store에서 한 번 읽는다.
  // 복원·프리필이 끝난 뒤 다시 마운트해야 그 값이 반영된다. 0이면 아직 준비 전이다.
  const [wizardKey, setWizardKey] = useState(0);

  useEffect(() => {
    // ?builder 토글은 같은 라우트라 리마운트되지 않으므로, 가드를 풀지 않으면
    // 두 번째 builder 진입에서 프리필 소비가 스킵돼 이전 여행이 남는다.
    if (!builder) { didInit.current = false; return; }
    if (didInit.current) return;
    didInit.current = true;

    const remount = () => setWizardKey((k) => k + 1);
    void initialize().then(remount);

    async function initialize() {
      if (isWizardReload()) {
        await useWizardStore.persist.rehydrate();
        const { currentStep, setStep } = useWizardStore.getState();
        setStep(currentStep);
        return;
      }

      if (stepParam != null) {
        const n = Number(stepParam);
        if (Number.isFinite(n)) useWizardStore.getState().setStep(n);
        return;
      }

      reset();

      const rawParsed = sessionStorage.getItem(NEW_TRIP_PARSED_KEY);
      if (rawParsed) {
        sessionStorage.removeItem(NEW_TRIP_PARSED_KEY);
        sessionStorage.removeItem(NEW_TRIP_SENTENCE_KEY);
        try {
          const payload = JSON.parse(rawParsed);
          if (payload && typeof payload === 'object' && typeof payload.sentence === 'string') {
            applyPrefill(payload.sentence, (payload.parsed ?? null) as ParsedTrip | null);
          }
        } catch {
          /* 손상된 페이로드는 버리고 빈 마법사로 시작한다 */
        }
        return;
      }

      // 비로그인 상태에서 넘어온 문장은 파싱되지 않았으므로 로그인한 지금 파싱한다.
      const sentence = sessionStorage.getItem(NEW_TRIP_SENTENCE_KEY);
      if (!sentence) return;
      sessionStorage.removeItem(NEW_TRIP_SENTENCE_KEY);
      // 파싱이 실패해도 description은 남게 먼저 채운다.
      useWizardStore.getState().updateData({ description: sentence.slice(0, DESCRIPTION_MAX_LENGTH) });

      // abort하면 StrictMode(dev) 2회차의 조기 return과 겹쳐 구조화 프리필이 유실된다.
      // applyPrefill은 스토어만 바꾸므로 언마운트 뒤 늦게 도착해도 다음 진입에서 reset된다.
      parseTripSentence(sentence)
        .then((parsed) => { if (parsed) { applyPrefill(sentence, parsed); remount(); } })
        .catch(() => { /* 파싱 실패 → description만 유지 */ });
    }
  }, [builder, reset, stepParam]);

  if (!builder) {
    return <NewTripShell />;
  }

  const steps = [
    <TripBasicsStep key="basics" />,
    <TasteStep key="taste" />,
    <StyleStep key="style" />,
    <BudgetPlacesStep key="budget" />,
    <ConfirmStep key="confirm" />,
  ];

  return (
    <div className="h-[calc(100dvh-8rem)]">
      <h1 className="sr-only">새 여행 만들기</h1>
      {wizardKey > 0 && <WizardLayout
        key={wizardKey}
        optionalSteps={[3]}
        onSkip={() => useWizardStore.getState().updateData({ budget: null, selectedPlaces: [] })}
      >
        {steps}
      </WizardLayout>}
    </div>
  );
}

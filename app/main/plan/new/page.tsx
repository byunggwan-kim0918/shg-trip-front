'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { NEW_TRIP_SENTENCE_KEY, NEW_TRIP_PARSED_KEY } from '@/lib/constants/newTrip';
import { parseTripSentence, type ParsedTrip } from '@/lib/data/itineraryService';
import type { WizardData, Theme, Category, TripPace, TransportPref } from '@/lib/types/itinerary';
import NewTripShell from '@/components/itinerary/NewTripShell';
import WizardLayout from '@/components/itinerary/wizard/WizardLayout';
import TripBasicsStep from '@/components/itinerary/wizard/steps/TripBasicsStep';
import TasteStep from '@/components/itinerary/wizard/steps/TasteStep';
import StyleStep from '@/components/itinerary/wizard/steps/StyleStep';
import BudgetPlacesStep from '@/components/itinerary/wizard/steps/BudgetPlacesStep';
import ConfirmStep from '@/components/itinerary/wizard/steps/ConfirmStep';

/** 테마 → 기본 카테고리 (문장에 카테고리 키워드가 없을 때 AI 이해값으로 보강용). */
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
const DEFAULT_THEME: Theme[] = ['healing'];

/** 파싱된 테마에서 기본 카테고리 유도(최대 4개). 매핑이 없으면 무난한 기본 세트. */
function deriveCategories(themes: Theme[]): Category[] {
  const set = new Set<Category>();
  for (const t of themes) for (const c of THEME_DEFAULT_CATEGORIES[t] ?? []) set.add(c);
  const derived = Array.from(set).slice(0, 4);
  return derived.length > 0 ? derived : DEFAULT_CATEGORIES;
}

/**
 * 파싱 결과 + 원문 문장을 마법사 필드로 프리필한다.
 * 자연어 흐름의 핵심: 문장에 없던 필수 필드(테마/카테고리)를 AI 이해값 기반으로 자동 보강해
 * 선택 화면 없이 곧장 확인(ConfirmStep, 요약)으로 보낸다. (여행지+기간이 있을 때만 — 없으면 마법사)
 */
function applyPrefill(sentence: string, parsed: ParsedTrip | null) {
  const partial: Partial<WizardData> = { description: sentence };
  if (parsed) {
    if (parsed.destination) partial.destination = parsed.destination;
    if (parsed.startDate) partial.startDate = parsed.startDate;
    if (parsed.endDate) partial.endDate = parsed.endDate;
    if (parsed.themes?.length) partial.themes = parsed.themes as Theme[];
    if (parsed.categories?.length) partial.categories = parsed.categories as Category[];
    if (parsed.pace) partial.pace = parsed.pace as TripPace;
    if (parsed.transportPref) partial.transportPref = parsed.transportPref as TransportPref;
    if (parsed.budget != null) partial.budget = parsed.budget;
    // party는 프리필하지 않음(홀18) — 원문 문장(description)에 이미 포함, enrich가 자유텍스트로 읽음.
  }
  useWizardStore.getState().updateData(partial);

  // 여행지+기간이 있으면 확인 화면으로 직행. 테마/카테고리(생성 필수 @NotEmpty)가 비면
  // AI가 이해한 테마 기반으로 자동 보강 → 사용자는 선택 화면 없이 요약을 확인하고 생성.
  const d = useWizardStore.getState().data;
  if (d.destination && d.startDate && d.endDate) {
    const boost: Partial<WizardData> = {};
    if (d.themes.length === 0) boost.themes = DEFAULT_THEME;
    const effectiveThemes = boost.themes ?? d.themes;
    if (d.categories.length === 0) boost.categories = deriveCategories(effectiveThemes);
    if (Object.keys(boost).length > 0) useWizardStore.getState().updateData(boost);
    useWizardStore.getState().setStep(4);
  }
}

/**
 * 통합 새 여행 진입점.
 * - `?builder=1` 없음 → NewTripShell(자연어 입력 + 실시간 파싱).
 * - `?builder=1` → 5단계 마법사. 파싱 결과 프리필 + ConfirmStep 점프.
 */
export default function PlanNewPage() {
  const searchParams = useSearchParams();
  const builder = searchParams.get('builder') === '1';
  // "조건 수정" 재진입(LoadingScreen 에러): 기존 입력을 보존한 채 지정 단계로 점프.
  const stepParam = searchParams.get('step');
  const { reset } = useWizardStore();
  // consume-once 가드: StrictMode(dev) 이중 실행 시 2회차가 프리필을 지우는 것을 방지.
  const didInit = useRef(false);

  useEffect(() => {
    // shell로 돌아오면 가드를 풀어준다 — 같은 라우트(?builder 토글)라 PlanNewPage가 리마운트되지
    // 않으므로, 리셋 없이는 두 번째 builder 진입에서 새 프리필/파싱 소비가 스킵돼 이전 여행이 남는다.
    if (!builder) { didInit.current = false; return; }
    if (didInit.current) return;
    didInit.current = true;

    // (0) step 파라미터가 있으면 reset·파싱 없이 기존 마법사 데이터 유지 + 해당 단계로 점프.
    if (stepParam != null) {
      const n = Number(stepParam);
      if (Number.isFinite(n)) useWizardStore.getState().setStep(n);
      return;
    }

    reset();

    // (1) NewTripShell에서 구조화 파싱 결과가 넘어온 경우 → 동기 프리필
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
        /* 손상된 페이로드 무시 → 빈 마법사 */
      }
      return;
    }

    // (2) 랜딩/대시보드에서 문장만 넘어온 경우(비로그인 → 파싱 불가였음) → 로그인된 지금 파싱
    const sentence = sessionStorage.getItem(NEW_TRIP_SENTENCE_KEY);
    if (!sentence) return;
    sessionStorage.removeItem(NEW_TRIP_SENTENCE_KEY);
    // 문장이 있으면 우선 description만 프리필(파싱 실패 대비)
    useWizardStore.getState().updateData({ description: sentence });

    // didInit 가드로 논리적 1회 실행 보장. applyPrefill은 Zustand 스토어만 변경하므로
    // 언마운트 후 늦게 도착해도 안전(다음 마법사 진입 시 reset). 그래서 abort로 취소하지 않는다
    // — abort하면 StrictMode(dev) 2회차 조기 return과 겹쳐 구조화 프리필이 유실된다.
    parseTripSentence(sentence)
      .then((parsed) => { if (parsed) applyPrefill(sentence, parsed); })
      .catch(() => { /* 파싱 실패 → description만 유지 */ });
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
    <div className="h-[calc(100vh-8rem)]">
      <WizardLayout optionalSteps={[3]}>{steps}</WizardLayout>
    </div>
  );
}

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

/** 파싱 결과 + 원문 문장을 마법사 필드로 프리필하고, destination+날짜가 모두 있으면 확인 단계로 점프. */
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
  // 필수 단계(0: 여행지+기간, 1: 테마+카테고리)가 모두 충족될 때만 ConfirmStep 점프.
  // 테마/카테고리가 비면 백엔드 generate가 @NotEmpty로 400 → step1을 거치도록 점프하지 않는다.
  const d = useWizardStore.getState().data;
  if (d.destination && d.startDate && d.endDate && d.themes.length > 0 && d.categories.length > 0) {
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
  const { reset } = useWizardStore();
  // consume-once 가드: StrictMode(dev) 이중 실행 시 2회차가 프리필을 지우는 것을 방지.
  const didInit = useRef(false);

  useEffect(() => {
    if (!builder) return;
    if (didInit.current) return;
    didInit.current = true;
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
  }, [builder, reset]);

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

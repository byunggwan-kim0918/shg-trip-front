/**
 * 자연어 새 여행 입력 공유 상수.
 * 랜딩 입력창 → 새 여행 화면으로 문장을 전달할 때 sessionStorage를 사용한다.
 * (Layer A: 문장은 wizard description 프리필로만 활용. LLM 파싱은 Layer B에서.)
 */
export const NEW_TRIP_SENTENCE_KEY = 'shg.newTripSentence';

export const SENTENCE_PLACEHOLDER =
  '예) 7월 말에 제주로 2박 3일, 카페랑 오름 위주로 여유롭게';

/** 랜딩 예시 칩: 라벨 + 클릭 시 프리필될 문장. */
export const EXAMPLE_CHIPS: Array<{ label: string; sentence: string }> = [
  {
    label: '제주 힐링 3일',
    sentence: '제주로 2박 3일, 바다 보면서 카페랑 오름 위주로 여유롭게 힐링하고 싶어',
  },
  {
    label: '부산 미식 주말',
    sentence: '주말에 부산으로 1박 2일, 해산물이랑 로컬 맛집 위주로 미식 여행',
  },
  {
    label: '도쿄 4박 5일',
    sentence: '도쿄로 4박 5일, 쇼핑이랑 미식 위주로 알차게 다니고 싶어',
  },
  {
    label: '경주 역사 투어',
    sentence: '경주로 1박 2일, 유적지랑 박물관 위주로 역사 테마 여행',
  },
];

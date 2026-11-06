/** 랜딩·대시보드 입력창에서 새 여행 화면으로 넘기는 원문 문장(sessionStorage). */
export const NEW_TRIP_SENTENCE_KEY = 'shg.newTripSentence';

/** NewTripShell의 /parse 결과(원문 + 구조화 필드). builder가 프리필 후 ConfirmStep으로 점프한다. */
export const NEW_TRIP_PARSED_KEY = 'shg.newTripParsed';

export const SENTENCE_PLACEHOLDER =
  '예) 7월 말에 제주로 2박 3일, 카페랑 오름 위주로 여유롭게';

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

/** 서버 DTO 상한과 같다. 넘기면 생성 버튼을 눌러야 400을 본다. */
export const DESCRIPTION_MAX_LENGTH = 500;
export const DESTINATION_MAX_LENGTH = 50;
export const MANUAL_PLACE_NAME_MAX_LENGTH = 100;

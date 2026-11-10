/** 랜딩·대시보드 입력창에서 새 여행 화면으로 넘기는 원문 문장(sessionStorage). */
export const NEW_TRIP_SENTENCE_KEY = 'shg.newTripSentence';

/** 대화 확인으로 시작한 생성 작업. 생성 화면이 읽어 그 작업에 연결한다. */
export const NEW_TRIP_JOB_KEY = 'shg.newTripJob';

/** 생성 화면이 연결 중인 작업과 그 작업을 만든 대화. 새로고침 재연결과 완료 뒤 대화 보관에 쓴다. */
export const ACTIVE_JOB_KEY = 'shg_active_job_id';
export const ACTIVE_CHAT_KEY = 'shg_active_chat_id';

// 모바일 한 줄 입력칸에서 잘리지 않는 길이로 둔다. 자세한 예시는 아래 예시 칩이 맡는다.
export const SENTENCE_PLACEHOLDER = '예) 제주 2박 3일, 오름이랑 카페 위주로';

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

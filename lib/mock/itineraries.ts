import type { Itinerary } from '@/lib/types/itinerary';
import { mockPlaces } from './places';

const p = (id: string) => mockPlaces.find((pl) => pl.id === id)!;

export const mockItineraries: Itinerary[] = [
  {
    id: 'itin-1',
    destination: '서울',
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    totalBudget: 350000,
    status: 'confirmed',
    createdAt: '2026-03-20T10:00:00Z',
    mode: 'auto',
    days: [
      {
        day: 1,
        date: '2026-04-10',
        steps: [
          {
            id: 's1-1',
            placeId: 'p1',
            place: p('p1'),
            startTime: '09:00',
            endTime: '11:00',
            description: '조선 왕조의 법궁 경복궁을 관람합니다. 수문장 교대식을 놓치지 마세요.',
            alternatives: [
              { id: 'a1-1-1', place: p('p2'), description: '유네스코 세계문화유산 창덕궁', rating: 4.8 },
              { id: 'a1-1-2', place: p('p5'), description: '대한제국의 황궁 덕수궁', rating: 4.4 },
              { id: 'a1-1-3', place: p('p8'), description: '봄 벚꽃이 아름다운 창경궁', rating: 4.4 },
            ],
          },
          {
            id: 's1-2',
            placeId: 'p3',
            place: p('p3'),
            startTime: '11:30',
            endTime: '13:00',
            description: '경복궁 인근 북촌한옥마을을 산책합니다. 전통 한옥의 아름다움을 감상하세요.',
            alternatives: [
              { id: 'a1-2-1', place: p('p6'), description: '전통 공예품과 갤러리의 거리 인사동', rating: 4.3 },
              { id: 'a1-2-2', place: p('p20'), description: '갤러리와 카페가 어우러진 삼청동', rating: 4.5 },
              { id: 'a1-2-3', place: p('p7'), description: '이순신 장군 동상이 있는 광화문광장', rating: 4.2 },
            ],
          },
          {
            id: 's1-3',
            placeId: 'p11',
            place: p('p11'),
            startTime: '13:00',
            endTime: '14:30',
            description: '광장시장에서 점심을 먹습니다. 빈대떡과 마약김밥을 꼭 드세요.',
            alternatives: [
              { id: 'a1-3-1', place: p('p13'), description: '엽전 도시락으로 유명한 통인시장', rating: 4.3 },
              { id: 'a1-3-2', place: p('p12'), description: '노가리와 생맥주의 을지로 골목', rating: 4.4 },
              { id: 'a1-3-3', place: p('p16'), description: '저렴하고 맛있는 신촌 먹자골목', rating: 4.1 },
            ],
          },
          {
            id: 's1-4',
            placeId: 'p17',
            place: p('p17'),
            startTime: '15:00',
            endTime: '16:30',
            description: '익선동 한옥 카페에서 오후 휴식을 취합니다.',
            alternatives: [
              { id: 'a1-4-1', place: p('p18'), description: '공장을 개조한 힙한 성수동 카페', rating: 4.6 },
              { id: 'a1-4-2', place: p('p19'), description: '경의선 숲길 옆 연남동 카페', rating: 4.4 },
              { id: 'a1-4-3', place: p('p20'), description: '고즈넉한 삼청동 카페 거리', rating: 4.5 },
            ],
          },
          {
            id: 's1-5',
            placeId: 'p4',
            place: p('p4'),
            startTime: '18:00',
            endTime: '20:00',
            description: '남산서울타워에서 서울 야경을 감상합니다. 일몰 시간에 맞춰 방문하세요.',
            alternatives: [
              { id: 'a1-5-1', place: p('p28'), description: '한강 유람선으로 야경 감상', rating: 4.3 },
              { id: 'a1-5-2', place: p('p27'), description: 'DDP 야간 조명 감상', rating: 4.4 },
              { id: 'a1-5-3', place: p('p9'), description: '서울숲 야간 산책', rating: 4.5 },
            ],
          },
        ],
        transits: [
          { from: 's1-1', to: 's1-2', type: 'walk', duration: 15 },
          { from: 's1-2', to: 's1-3', type: 'walk', duration: 10 },
          { from: 's1-3', to: 's1-4', type: 'subway', duration: 20 },
          { from: 's1-4', to: 's1-5', type: 'bus', duration: 25 },
        ],
      },
      {
        day: 2,
        date: '2026-04-11',
        steps: [
          {
            id: 's2-1',
            placeId: 'p25',
            place: p('p25'),
            startTime: '10:00',
            endTime: '12:30',
            description: '국립중앙박물관에서 한국의 역사와 문화를 탐방합니다.',
            alternatives: [
              { id: 'a2-1-1', place: p('p26'), description: '현대 미술을 감상하는 국립현대미술관', rating: 4.5 },
              { id: 'a2-1-2', place: p('p27'), description: '독특한 건축의 DDP 전시 관람', rating: 4.4 },
              { id: 'a2-1-3', place: p('p2'), description: '창덕궁 후원 투어', rating: 4.8 },
            ],
          },
          {
            id: 's2-2',
            placeId: 'p14',
            place: p('p14'),
            startTime: '13:00',
            endTime: '14:30',
            description: '이태원 경리단길에서 다양한 세계 음식을 즐깁니다.',
            alternatives: [
              { id: 'a2-2-1', place: p('p15'), description: '로컬 맛집이 가득한 망원동', rating: 4.3 },
              { id: 'a2-2-2', place: p('p11'), description: '전통 시장 음식의 광장시장', rating: 4.6 },
              { id: 'a2-2-3', place: p('p12'), description: '을지로 노가리 골목', rating: 4.4 },
            ],
          },
          {
            id: 's2-3',
            placeId: 'p24',
            place: p('p24'),
            startTime: '15:00',
            endTime: '17:00',
            description: '여의도 한강공원에서 자전거를 타며 한강을 즐깁니다.',
            alternatives: [
              { id: 'a2-3-1', place: p('p9'), description: '도심 속 힐링 공간 서울숲', rating: 4.5 },
              { id: 'a2-3-2', place: p('p28'), description: '한강 유람선 탑승', rating: 4.3 },
              { id: 'a2-3-3', place: p('p10'), description: '홍대 거리 문화 탐방', rating: 4.3 },
            ],
          },
          {
            id: 's2-4',
            placeId: 'p29',
            place: p('p29'),
            startTime: '18:00',
            endTime: '20:00',
            description: '명동에서 저녁 쇼핑과 길거리 음식을 즐깁니다.',
            alternatives: [
              { id: 'a2-4-1', place: p('p31'), description: '트렌디한 강남 가로수길', rating: 4.4 },
              { id: 'a2-4-2', place: p('p30'), description: '24시간 패션의 동대문 쇼핑몰', rating: 4.2 },
              { id: 'a2-4-3', place: p('p32'), description: '별마당 도서관의 코엑스몰', rating: 4.3 },
            ],
          },
        ],
        transits: [
          { from: 's2-1', to: 's2-2', type: 'subway', duration: 15 },
          { from: 's2-2', to: 's2-3', type: 'subway', duration: 20 },
          { from: 's2-3', to: 's2-4', type: 'subway', duration: 30 },
        ],
      },
      {
        day: 3,
        date: '2026-04-12',
        steps: [
          {
            id: 's3-1',
            placeId: 'p18',
            place: p('p18'),
            startTime: '10:00',
            endTime: '11:30',
            description: '성수동 카페 거리에서 브런치를 즐깁니다.',
            alternatives: [
              { id: 'a3-1-1', place: p('p17'), description: '한옥 카페의 익선동', rating: 4.5 },
              { id: 'a3-1-2', place: p('p19'), description: '아늑한 연남동 카페 거리', rating: 4.4 },
              { id: 'a3-1-3', place: p('p20'), description: '고즈넉한 삼청동 카페', rating: 4.5 },
            ],
          },
          {
            id: 's3-2',
            placeId: 'p9',
            place: p('p9'),
            startTime: '12:00',
            endTime: '14:00',
            description: '서울숲에서 산책하며 여행의 마지막 날을 여유롭게 보냅니다.',
            alternatives: [
              { id: 'a3-2-1', place: p('p24'), description: '한강 자전거 라이딩', rating: 4.4 },
              { id: 'a3-2-2', place: p('p7'), description: '광화문광장 산책', rating: 4.2 },
              { id: 'a3-2-3', place: p('p6'), description: '인사동 전통 문화 체험', rating: 4.3 },
            ],
          },
          {
            id: 's3-3',
            placeId: 'p32',
            place: p('p32'),
            startTime: '15:00',
            endTime: '17:00',
            description: '코엑스몰 별마당 도서관을 구경하고 마지막 쇼핑을 즐깁니다.',
            alternatives: [
              { id: 'a3-3-1', place: p('p29'), description: '명동 마지막 쇼핑', rating: 4.3 },
              { id: 'a3-3-2', place: p('p31'), description: '가로수길 쇼핑', rating: 4.4 },
              { id: 'a3-3-3', place: p('p30'), description: '동대문 쇼핑몰', rating: 4.2 },
            ],
          },
        ],
        transits: [
          { from: 's3-1', to: 's3-2', type: 'subway', duration: 10 },
          { from: 's3-2', to: 's3-3', type: 'subway', duration: 25 },
        ],
      },
    ],
  },
  {
    id: 'itin-2',
    destination: '서울',
    startDate: '2026-03-01',
    endDate: '2026-03-02',
    totalBudget: 150000,
    status: 'in_progress',
    createdAt: '2026-02-28T09:00:00Z',
    mode: 'manual',
    days: [
      {
        day: 1,
        date: '2026-03-01',
        steps: [
          {
            id: 'ms1-1',
            placeId: 'p10',
            place: p('p10'),
            startTime: '13:00',
            endTime: '15:00',
            description: '홍대 거리를 탐방합니다.',
            alternatives: [
              { id: 'ma1-1-1', place: p('p19'), description: '연남동 카페 거리', rating: 4.4 },
              { id: 'ma1-1-2', place: p('p15'), description: '망원동 맛집 거리', rating: 4.3 },
              { id: 'ma1-1-3', place: p('p16'), description: '신촌 먹자골목', rating: 4.1 },
            ],
          },
          {
            id: 'ms1-2',
            placeId: 'p19',
            place: p('p19'),
            startTime: '15:30',
            endTime: '17:00',
            description: '연남동 카페에서 여유로운 오후를 보냅니다.',
            alternatives: [
              { id: 'ma1-2-1', place: p('p18'), description: '성수동 힙한 카페', rating: 4.6 },
              { id: 'ma1-2-2', place: p('p17'), description: '익선동 한옥 카페', rating: 4.5 },
              { id: 'ma1-2-3', place: p('p20'), description: '삼청동 카페 거리', rating: 4.5 },
            ],
          },
        ],
        transits: [
          { from: 'ms1-1', to: 'ms1-2', type: 'walk', duration: 10 },
        ],
      },
    ],
  },
];

import type { Place } from '@/lib/types/itinerary';

export const mockPlaces: Place[] = [
  // 관광지 (attraction)
  {
    id: 'p1', name: '경복궁', category: 'attraction',
    address: '서울 종로구 사직로 161', lat: 37.5796, lng: 126.9770,
    rating: 4.7, description: '조선 왕조의 법궁. 근정전, 경회루 등 주요 전각이 있습니다.',
  },
  {
    id: 'p2', name: '창덕궁', category: 'attraction',
    address: '서울 종로구 율곡로 99', lat: 37.5794, lng: 126.9910,
    rating: 4.8, description: '유네스코 세계문화유산. 후원(비원)이 아름답습니다.',
  },
  {
    id: 'p3', name: '북촌한옥마을', category: 'attraction',
    address: '서울 종로구 계동길 37', lat: 37.5826, lng: 126.9830,
    rating: 4.5, description: '600년 역사의 한옥 밀집 지역. 서울의 전통 주거 문화를 체험할 수 있습니다.',
  },
  {
    id: 'p4', name: '남산서울타워', category: 'attraction',
    address: '서울 용산구 남산공원길 105', lat: 37.5512, lng: 126.9882,
    rating: 4.6, description: '서울 전경을 한눈에 볼 수 있는 랜드마크. 야경이 특히 아름답습니다.',
  },
  {
    id: 'p5', name: '덕수궁', category: 'attraction',
    address: '서울 중구 세종대로 99', lat: 37.5657, lng: 126.9752,
    rating: 4.4, description: '대한제국의 황궁. 석조전과 돌담길이 유명합니다.',
  },
  {
    id: 'p6', name: '인사동', category: 'attraction',
    address: '서울 종로구 인사동길', lat: 37.5742, lng: 126.9853,
    rating: 4.3, description: '전통 공예품, 갤러리, 찻집이 모여 있는 문화 거리.',
  },
  {
    id: 'p7', name: '광화문광장', category: 'attraction',
    address: '서울 종로구 세종대로 172', lat: 37.5720, lng: 126.9769,
    rating: 4.2, description: '이순신 장군 동상과 세종대왕 동상이 있는 서울의 중심 광장.',
  },
  {
    id: 'p8', name: '창경궁', category: 'attraction',
    address: '서울 종로구 창경궁로 185', lat: 37.5786, lng: 126.9952,
    rating: 4.4, description: '조선 시대 궁궐. 봄 벚꽃이 아름답습니다.',
  },
  {
    id: 'p9', name: '서울숲', category: 'attraction',
    address: '서울 성동구 뚝섬로 273', lat: 37.5444, lng: 127.0374,
    rating: 4.5, description: '도심 속 대형 공원. 사슴 방사장과 나비 정원이 있습니다.',
  },
  {
    id: 'p10', name: '홍대 거리', category: 'attraction',
    address: '서울 마포구 홍익로 3길', lat: 37.5563, lng: 126.9236,
    rating: 4.3, description: '젊음과 예술의 거리. 클럽, 카페, 갤러리가 밀집해 있습니다.',
  },

  // 맛집 (restaurant)
  {
    id: 'p11', name: '광장시장', category: 'restaurant',
    address: '서울 종로구 창경궁로 88', lat: 37.5700, lng: 126.9994,
    rating: 4.6, description: '100년 전통의 재래시장. 빈대떡, 마약김밥, 순대가 유명합니다.',
  },
  {
    id: 'p12', name: '을지로 노가리 골목', category: 'restaurant',
    address: '서울 중구 을지로 119', lat: 37.5665, lng: 126.9906,
    rating: 4.4, description: '노가리와 생맥주로 유명한 을지로의 명물 골목.',
  },
  {
    id: 'p13', name: '통인시장', category: 'restaurant',
    address: '서울 종로구 자하문로15길 18', lat: 37.5793, lng: 126.9693,
    rating: 4.3, description: '엽전 도시락으로 유명한 전통 시장. 다양한 분식과 반찬을 맛볼 수 있습니다.',
  },
  {
    id: 'p14', name: '이태원 경리단길', category: 'restaurant',
    address: '서울 용산구 회나무로 13길', lat: 37.5384, lng: 126.9944,
    rating: 4.2, description: '다양한 세계 음식 레스토랑이 모여 있는 이국적인 거리.',
  },
  {
    id: 'p15', name: '망원동 맛집 거리', category: 'restaurant',
    address: '서울 마포구 망원동', lat: 37.5558, lng: 126.9100,
    rating: 4.3, description: '로컬 맛집이 밀집한 망원동. 다양한 한식과 퓨전 음식을 즐길 수 있습니다.',
  },
  {
    id: 'p16', name: '신촌 먹자골목', category: 'restaurant',
    address: '서울 서대문구 신촌로 83', lat: 37.5558, lng: 126.9368,
    rating: 4.1, description: '대학가 주변 다양한 음식점. 저렴하고 맛있는 음식이 많습니다.',
  },

  // 카페 (cafe)
  {
    id: 'p17', name: '익선동 카페 거리', category: 'cafe',
    address: '서울 종로구 익선동', lat: 37.5742, lng: 126.9990,
    rating: 4.5, description: '한옥을 개조한 트렌디한 카페들이 모여 있는 골목.',
  },
  {
    id: 'p18', name: '성수동 카페 거리', category: 'cafe',
    address: '서울 성동구 성수이로 78', lat: 37.5447, lng: 127.0557,
    rating: 4.6, description: '공장을 개조한 힙한 카페들이 밀집한 서울의 핫플레이스.',
  },
  {
    id: 'p19', name: '연남동 카페 거리', category: 'cafe',
    address: '서울 마포구 연남동', lat: 37.5622, lng: 126.9244,
    rating: 4.4, description: '경의선 숲길 주변 아늑한 카페들이 모여 있는 동네.',
  },
  {
    id: 'p20', name: '삼청동 카페 거리', category: 'cafe',
    address: '서울 종로구 삼청로', lat: 37.5826, lng: 126.9810,
    rating: 4.5, description: '북촌 인근 갤러리와 카페가 어우러진 고즈넉한 거리.',
  },

  // 숙박 (accommodation)
  {
    id: 'p21', name: '롯데호텔 서울', category: 'accommodation',
    address: '서울 중구 을지로 30', lat: 37.5650, lng: 126.9820,
    rating: 4.7, description: '서울 도심의 5성급 호텔. 명동과 가까워 쇼핑하기 편리합니다.',
  },
  {
    id: 'p22', name: '신라호텔', category: 'accommodation',
    address: '서울 중구 동호로 249', lat: 37.5570, lng: 127.0050,
    rating: 4.8, description: '남산 자락에 위치한 럭셔리 호텔. 정원과 수영장이 아름답습니다.',
  },
  {
    id: 'p23', name: '게스트하우스 코리아', category: 'accommodation',
    address: '서울 종로구 북촌로 5길', lat: 37.5810, lng: 126.9840,
    rating: 4.3, description: '북촌 한옥마을 내 한옥 게스트하우스. 전통 문화 체험 가능.',
  },

  // 체험/액티비티 (experience)
  {
    id: 'p24', name: '한강 자전거 대여', category: 'experience',
    address: '서울 영등포구 여의도동 한강공원', lat: 37.5285, lng: 126.9326,
    rating: 4.4, description: '한강변을 따라 자전거를 타며 서울의 풍경을 즐길 수 있습니다.',
  },
  {
    id: 'p25', name: '국립중앙박물관', category: 'experience',
    address: '서울 용산구 서빙고로 137', lat: 37.5237, lng: 126.9804,
    rating: 4.7, description: '한국의 역사와 문화를 한눈에 볼 수 있는 국내 최대 박물관.',
  },
  {
    id: 'p26', name: '국립현대미술관 서울관', category: 'experience',
    address: '서울 종로구 삼청로 30', lat: 37.5793, lng: 126.9800,
    rating: 4.5, description: '현대 미술 작품을 감상할 수 있는 국립 미술관.',
  },
  {
    id: 'p27', name: 'DDP 동대문디자인플라자', category: 'experience',
    address: '서울 중구 을지로 281', lat: 37.5669, lng: 127.0095,
    rating: 4.4, description: '자하 하디드가 설계한 독특한 건축물. 전시와 쇼핑을 즐길 수 있습니다.',
  },
  {
    id: 'p28', name: '한강 유람선', category: 'experience',
    address: '서울 영등포구 여의도동 여의나루', lat: 37.5280, lng: 126.9340,
    rating: 4.3, description: '한강을 따라 서울의 야경을 감상할 수 있는 유람선.',
  },

  // 쇼핑 (shopping)
  {
    id: 'p29', name: '명동 쇼핑 거리', category: 'shopping',
    address: '서울 중구 명동길', lat: 37.5636, lng: 126.9826,
    rating: 4.3, description: '화장품, 패션, 음식이 가득한 서울 최대 쇼핑 거리.',
  },
  {
    id: 'p30', name: '동대문 쇼핑몰', category: 'shopping',
    address: '서울 중구 을지로 281', lat: 37.5665, lng: 127.0090,
    rating: 4.2, description: '24시간 운영하는 패션 도매 및 소매 쇼핑 단지.',
  },
  {
    id: 'p31', name: '가로수길', category: 'shopping',
    address: '서울 강남구 신사동 가로수길', lat: 37.5196, lng: 127.0228,
    rating: 4.4, description: '트렌디한 패션 브랜드와 카페가 늘어선 강남의 쇼핑 거리.',
  },
  {
    id: 'p32', name: '코엑스몰', category: 'shopping',
    address: '서울 강남구 영동대로 513', lat: 37.5130, lng: 127.0590,
    rating: 4.3, description: '별마당 도서관이 있는 대형 복합 쇼핑몰.',
  },
];

# ⚛️ CLAUDE_FRONTEND.md - Next.js + React 프론트엔드 설정

> Next.js + React 프론트엔드 개발 시 적용되는 규칙

---

## 📌 기술 스택

```yaml
Framework: Next.js 14+ (App Router)
Language: TypeScript (strict mode)
Styling: Tailwind CSS + shadcn/ui
State: Zustand (전역) + TanStack Query (서버 상태)
Form: React Hook Form + Zod
Map: Kakao Maps SDK 또는 Google Maps
HTTP: Axios 또는 Fetch API
Test: Jest + React Testing Library + Playwright
```

---

## 🏗️ 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                      # App Router 페이지
│   │   ├── (auth)/               # 인증 관련 (로그인/회원가입)
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (main)/               # 메인 레이아웃
│   │   │   ├── trips/
│   │   │   ├── plan/
│   │   │   └── my/
│   │   ├── api/                  # API Routes (필요시)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   ├── common/               # 공통 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── trip/                 # 여행 도메인 컴포넌트
│   │   ├── plan/                 # 플랜 도메인 컴포넌트
│   │   └── map/                  # 지도 컴포넌트
│   ├── hooks/                    # 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useTrips.ts
│   │   └── useMap.ts
│   ├── lib/                      # 유틸리티
│   │   ├── api/                  # API 클라이언트
│   │   │   ├── client.ts
│   │   │   ├── trips.ts
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   └── validations/
│   ├── stores/                   # Zustand 스토어
│   │   ├── useAuthStore.ts
│   │   └── useTripStore.ts
│   ├── types/                    # TypeScript 타입
│   │   ├── api.ts
│   │   ├── trip.ts
│   │   └── user.ts
│   └── constants/                # 상수
│       ├── routes.ts
│       └── config.ts
├── public/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔐 보안 필수 규칙

### 1. XSS 방지
```tsx
// ❌ 위험 - dangerouslySetInnerHTML 직접 사용
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 필요한 경우 DOMPurify로 sanitize
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// ✅ 일반 텍스트는 그대로 렌더링 (React 자동 이스케이프)
<p>{userInput}</p>  // 안전
```

### 2. 인증 토큰 관리
```tsx
// lib/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  // ❌ localStorage에 토큰 저장 (XSS 취약)
  // const token = localStorage.getItem('token');
  
  // ✅ httpOnly 쿠키 사용 시 자동 전송됨
  // 또는 메모리 스토어에서 가져오기
  const token = useAuthStore.getState().accessToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor - 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Refresh Token으로 갱신 시도
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,  // httpOnly 쿠키 전송
        });
        
        useAuthStore.getState().setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 로그아웃
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 3. 환경 변수 관리
```bash
# .env.example (커밋 대상)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_KAKAO_MAP_KEY=
NEXT_PUBLIC_GA_ID=

# .env.local (커밋 제외)
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_KAKAO_MAP_KEY=your_actual_key
```

```tsx
// constants/config.ts
export const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL!,
  KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY!,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// 런타임 검증
if (!CONFIG.API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is required');
}
```

### 4. 입력값 검증 (Zod)
```tsx
// lib/validations/trip.ts
import { z } from 'zod';

export const tripCreateSchema = z.object({
  title: z
    .string()
    .min(1, '여행 제목을 입력해주세요')
    .max(100, '제목은 100자 이내로 입력해주세요')
    .regex(/^[가-힣a-zA-Z0-9\s]+$/, '특수문자는 사용할 수 없습니다'),
  destination: z
    .string()
    .min(1, '여행지를 선택해주세요'),
  startDate: z
    .string()
    .refine((val) => new Date(val) >= new Date(), '과거 날짜는 선택할 수 없습니다'),
  endDate: z.string(),
  theme: z.enum(['HEALING', 'FOOD', 'NATURE', 'ACTIVITY', 'FAMILY', 'DATE']),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: '종료일은 시작일 이후여야 합니다',
  path: ['endDate'],
});

export type TripCreateInput = z.infer<typeof tripCreateSchema>;
```

---

## 📝 코드 작성 규칙

### 1. 컴포넌트 구조
```tsx
// components/trip/TripCard.tsx
'use client';

import { useState } from 'react';
import { Trip } from '@/types/trip';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TripCardProps {
  trip: Trip;
  onSelect?: (tripId: number) => void;
  isSelected?: boolean;
}

export function TripCard({ trip, onSelect, isSelected = false }: TripCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onSelect?.(trip.id);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        isSelected && 'ring-2 ring-primary',
        isHovered && 'shadow-lg'
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{trip.title}</h3>
          <Badge variant={trip.status === 'CONFIRMED' ? 'default' : 'secondary'}>
            {trip.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{trip.destination}</p>
        <p className="text-sm">
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </p>
      </CardContent>
    </Card>
  );
}
```

### 2. 커스텀 훅 (TanStack Query)
```tsx
// hooks/useTrips.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripApi } from '@/lib/api/trips';
import { TripCreateInput } from '@/lib/validations/trip';

// Query Keys 중앙 관리
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: string) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: number) => [...tripKeys.details(), id] as const,
};

// 여행 목록 조회
export function useTrips(page = 0, size = 10) {
  return useQuery({
    queryKey: tripKeys.list(`page=${page}&size=${size}`),
    queryFn: () => tripApi.getTrips({ page, size }),
    staleTime: 1000 * 60 * 5,  // 5분
  });
}

// 여행 상세 조회
export function useTrip(tripId: number) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripApi.getTrip(tripId),
    enabled: !!tripId,
  });
}

// 여행 생성
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TripCreateInput) => tripApi.createTrip(data),
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

// 여행 삭제
export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripId: number) => tripApi.deleteTrip(tripId),
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
    },
  });
}
```

### 3. 폼 처리 (React Hook Form + Zod)
```tsx
// components/trip/TripCreateForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { tripCreateSchema, TripCreateInput } from '@/lib/validations/trip';
import { useCreateTrip } from '@/hooks/useTrips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export function TripCreateForm() {
  const router = useRouter();
  const createTrip = useCreateTrip();

  const form = useForm<TripCreateInput>({
    resolver: zodResolver(tripCreateSchema),
    defaultValues: {
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      theme: 'HEALING',
    },
  });

  const onSubmit = async (data: TripCreateInput) => {
    try {
      const result = await createTrip.mutateAsync(data);
      toast.success('여행이 생성되었습니다');
      router.push(`/trips/${result.id}`);
    } catch (error) {
      toast.error('여행 생성에 실패했습니다');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...form.register('title')}
          placeholder="여행 제목"
          className={form.formState.errors.title ? 'border-red-500' : ''}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* ... 나머지 필드 */}

      <Button
        type="submit"
        disabled={createTrip.isPending}
        className="w-full"
      >
        {createTrip.isPending ? '생성 중...' : '여행 만들기'}
      </Button>
    </form>
  );
}
```

### 4. 전역 상태 (Zustand)
```tsx
// stores/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  nickname: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setAccessToken: (token) => set({ accessToken: token }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),  // sessionStorage 사용
      partialize: (state) => ({
        // accessToken은 persist하지 않음 (보안)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 📱 웹앱 디자인 규칙

### 1. 모바일 퍼스트 + 반응형
```tsx
// Tailwind 반응형 breakpoint
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

// 모바일 퍼스트로 작성
<div className="
  grid 
  grid-cols-1          /* 모바일: 1열 */
  sm:grid-cols-2       /* sm 이상: 2열 */
  lg:grid-cols-3       /* lg 이상: 3열 */
  gap-4
">
  {trips.map((trip) => (
    <TripCard key={trip.id} trip={trip} />
  ))}
</div>

// 터치 영역 최소 44x44px (접근성)
<Button className="min-h-[44px] min-w-[44px]">
  터치 버튼
</Button>
```

### 2. 로딩 상태 (Skeleton)
```tsx
// components/common/TripCardSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function TripCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// 사용
function TripList() {
  const { data, isLoading } = useTrips();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TripCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.content.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
```

### 3. 에러 바운더리
```tsx
// components/common/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Sentry 등 에러 트래킹 서비스로 전송
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-lg text-muted-foreground">
            문제가 발생했습니다
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
          >
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4. 하단 네비게이션 (모바일 앱 스타일)
```tsx
// components/common/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/plan', icon: Map, label: '플랜' },
  { href: '/trips', icon: Calendar, label: '내 여행' },
  { href: '/my', icon: User, label: '마이' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="
      fixed bottom-0 left-0 right-0
      bg-background border-t
      pb-safe                           /* iOS safe area */
      md:hidden                          /* 데스크톱에서 숨김 */
    ">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || 
            (href !== '/' && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-full h-full',
                'text-xs',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 5. 지도 컴포넌트
```tsx
// components/map/KakaoMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Place } from '@/types/place';

interface KakaoMapProps {
  places: Place[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (place: Place) => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export function KakaoMap({ places, center, onMarkerClick }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;

    window.kakao.maps.load(() => {
      const options = {
        center: new window.kakao.maps.LatLng(
          center?.lat ?? 37.5665,
          center?.lng ?? 126.9780
        ),
        level: 5,
      };
      const mapInstance = new window.kakao.maps.Map(mapRef.current, options);
      setMap(mapInstance);
    });
  }, [center]);

  // 마커 표시
  useEffect(() => {
    if (!map || !places.length) return;

    const markers: any[] = [];

    places.forEach((place) => {
      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      const marker = new window.kakao.maps.Marker({ position, map });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClick?.(place);
      });

      markers.push(marker);
    });

    // Cleanup
    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, places, onMarkerClick]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[400px] rounded-lg"
    />
  );
}
```

---

## ♿ 접근성 (a11y)

```tsx
// 키보드 네비게이션 지원
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
  aria-label="여행 일정 생성"
>
  새 여행 만들기
</button>

// 스크린 리더 전용 텍스트
<span className="sr-only">현재 선택된 여행</span>

// 이미지 대체 텍스트
<Image
  src={place.imageUrl}
  alt={`${place.name} - ${place.category}`}
  width={300}
  height={200}
/>

// 폼 레이블 연결
<div>
  <label htmlFor="trip-title" className="block text-sm font-medium">
    여행 제목
  </label>
  <input
    id="trip-title"
    name="title"
    type="text"
    aria-describedby="title-error"
    aria-invalid={!!errors.title}
  />
  {errors.title && (
    <p id="title-error" className="text-red-500 text-sm" role="alert">
      {errors.title.message}
    </p>
  )}
</div>
```

---

## 🧪 테스트 규칙

```tsx
// __tests__/components/TripCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TripCard } from '@/components/trip/TripCard';

const mockTrip = {
  id: 1,
  title: '제주도 여행',
  destination: '제주도',
  startDate: '2025-03-01',
  endDate: '2025-03-05',
  status: 'DRAFT' as const,
  theme: 'HEALING' as const,
};

describe('TripCard', () => {
  it('여행 정보가 올바르게 렌더링된다', () => {
    render(<TripCard trip={mockTrip} />);

    expect(screen.getByText('제주도 여행')).toBeInTheDocument();
    expect(screen.getByText('제주도')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('클릭 시 onSelect 콜백이 호출된다', () => {
    const onSelect = jest.fn();
    render(<TripCard trip={mockTrip} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('article'));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('선택된 상태일 때 스타일이 적용된다', () => {
    render(<TripCard trip={mockTrip} isSelected />);

    const card = screen.getByRole('article');
    expect(card).toHaveClass('ring-2');
  });
});
```

---

## 📋 체크리스트

### 컴포넌트 개발 시
- [ ] TypeScript Props 인터페이스 정의
- [ ] 로딩/에러/빈 상태 처리
- [ ] 모바일 반응형 확인
- [ ] 키보드 접근성 테스트
- [ ] Storybook 문서화 (선택)

### 페이지 개발 시
- [ ] SEO 메타데이터 설정
- [ ] 적절한 캐싱 전략 (ISR, SSR, CSR)
- [ ] 에러 바운더리 적용
- [ ] 로딩 UI (Suspense, Skeleton)

### API 연동 시
- [ ] TanStack Query 사용
- [ ] 에러 핸들링 통일
- [ ] 토스트/알림 피드백
- [ ] 요청 중 중복 방지 (isPending)

### 배포 전
- [ ] 환경변수 확인
- [ ] 빌드 에러 없음
- [ ] Lighthouse 점수 체크 (Performance, A11y)
- [ ] 크로스 브라우저 테스트

---

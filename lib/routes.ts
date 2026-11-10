/** 로그인 뒤 화면 경로. 경로 문자열은 여기서만 만든다. */
export const APP_ROOT = '/app';

export const ROUTES = {
  trips: `${APP_ROOT}/trips`,
  newTrip: `${APP_ROOT}/trips/new`,
  generating: `${APP_ROOT}/trips/generating`,
  trip: (id: number | string) => `${APP_ROOT}/trips/${id}`,
} as const;

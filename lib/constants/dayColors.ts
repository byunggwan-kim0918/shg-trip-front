/**
 * 일차는 순서라 올리브(70°)에서 파랑으로 한 방향으로만 흐르는 순서형 램프를 쓴다(최대 10일).
 * 마커 라벨이 흰색 고정이라 채움을 밝히면 대비가 4.5 아래로 떨어지므로 다크에서는 테두리·경로선만 밝힌다.
 */
export const DAY_COLORS = [
  { bg: '#5f6a1e', border: '#49521a', line: '#7a8729', borderDark: '#9cab36', lineDark: '#9cab36' }, //  1일차  70° 올리브 = 브랜드
  { bg: '#3d6b32', border: '#2e5226', line: '#4e8640', borderDark: '#64a855', lineDark: '#64a855' }, //  2일차 125° 초록
  { bg: '#1f6457', border: '#174c43', line: '#2a8273', borderDark: '#37a492', lineDark: '#37a492' }, //  3일차 165° 청록
  { bg: '#255d7e', border: '#1b4660', line: '#2f77a1', borderDark: '#4196c7', lineDark: '#4196c7' }, //  4일차 200° 바다
  { bg: '#3a4a86', border: '#2b3765', line: '#4b5fa8', borderDark: '#6c7fc8', lineDark: '#6c7fc8' }, //  5일차 228° 남색
  { bg: '#6b7335', border: '#535a29', line: '#879148', borderDark: '#a6b25c', lineDark: '#a6b25c' }, //  6일차  70° (밝은 변주)
  { bg: '#4c7742', border: '#3a5c33', line: '#64925a', borderDark: '#7fb473', lineDark: '#7fb473' }, //  7일차 125°
  { bg: '#357a6c', border: '#285d52', line: '#449587', borderDark: '#57b5a5', lineDark: '#57b5a5' }, //  8일차 165°
  { bg: '#3c7496', border: '#2d5872', line: '#4d8fb5', borderDark: '#68aed6', lineDark: '#68aed6' }, //  9일차 200°
  { bg: '#51619b', border: '#3d4a77', line: '#6878b5', borderDark: '#8696d2', lineDark: '#8696d2' }, // 10일차 228°
];

export function getDayColor(dayNumber: number, isDark = false) {
  const c = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  return isDark
    ? { bg: c.bg, border: c.borderDark, line: c.lineDark }
    : { bg: c.bg, border: c.border, line: c.line };
}

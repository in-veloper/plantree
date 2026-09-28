export const colors = {
  bg: '#F6F7F2',
  surface: '#FFFFFF',
  surfaceSoft: 'rgba(27, 33, 24, 0.045)',
  surfaceHigh: '#EAF0E4',

  line: 'rgba(27, 33, 24, 0.08)',
  lineStrong: 'rgba(27, 33, 24, 0.16)',

  text: '#1A1F18',
  textDim: '#6B7268',
  textFaint: '#A2A89C',

  // 나뭇잎/나무 테마 — 초록 계열 액센트. 과목 색은 TAG_COLORS 로 따로
  // 화려하게 두고, 앱 뼈대(버튼·탭·선택 표시)는 이 초록 하나로 통일한다.
  accent: '#2F8F5B',
  accentDeep: '#1F6B42',
  accentSoft: 'rgba(47, 143, 91, 0.12)',
  onAccent: '#FFFFFF',

  danger: '#E15554',
  dangerSoft: 'rgba(225, 85, 84, 0.12)',
  success: '#2FB380',
  successSoft: 'rgba(47, 179, 128, 0.14)',
};

// 달력 히트맵 단계 — 그날 공부한 시간에 따라 진해진다(초록 톤).
export const HEAT_LEVELS = [
  { min: 0, color: 'transparent', text: colors.text },
  { min: 1, color: 'rgba(47, 143, 91, 0.14)', text: colors.text },
  { min: 30, color: 'rgba(47, 143, 91, 0.32)', text: colors.text },
  { min: 60, color: 'rgba(47, 143, 91, 0.55)', text: '#FFFFFF' },
  { min: 120, color: colors.accent, text: '#FFFFFF' },
];

export function heatLevelFor(minutes) {
  let level = HEAT_LEVELS[0];
  for (const l of HEAT_LEVELS) {
    if (minutes >= l.min) level = l;
  }
  return level;
}

// 과목 태그용 팔레트 — 사용자가 일정을 만들 때 고를 수 있다.
export const TAG_COLORS = [
  { key: 'blue', color: '#2F6FED' },
  { key: 'coral', color: '#FF6B6B' },
  { key: 'amber', color: '#F5A623' },
  { key: 'teal', color: '#14B8A6' },
  { key: 'violet', color: '#8B5CF6' },
  { key: 'pink', color: '#EC4899' },
];

export const font = {
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

// 안드로이드 elevation 도, CSS boxShadow 도 이 빌드에서는 둥근 모서리를
// 무시하고 사각형으로 뭉개져서(실기기에서 직접 확인) react-native-shadow-2
// 로 바꿨다 — border-radius 를 정확히 읽어서 모서리까지 곡선으로 딱
// 맞게 그려주는 SVG 기반 그림자라 이런 문제 자체가 없다. Shadow 컴포넌트에
// 그대로 스프레드해서 쓴다: <Shadow {...shadowProps} style={...}>.
//
// 우측/하단만 켜고 좌측/상단을 끄면(sides, corners) 꺼진 변과 켜진 모서리가
// 만나는 지점(우상단·좌하단)에서 그라데이션 없이 뚝 끊기는 선이 생긴다 —
// 그래서 네 면 다 켜 두고, offset 을 우하단으로만 살짝 줘서 자연스럽게
// 그쪽이 더 진해 보이게 한다(모든 변·모서리가 선형/방사형 그라데이션이라
// 원래도 서서히 진해지는 방식).
export const shadowProps = {
  distance: 6,
  startColor: 'rgba(20, 53, 31, 0.12)',
  offset: [2, 3],
};

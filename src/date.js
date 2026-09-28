export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n) {
  return String(n).padStart(2, '0');
}

// 로컬 시간대 기준 'YYYY-MM-DD'. UTC 로 변환하면 자정 근처에 날짜가
// 하루 밀릴 수 있어서 반드시 로컬 필드로 직접 조립한다.
export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey() {
  return toKey(new Date());
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDay(a, b) {
  return toKey(a) === toKey(b);
}

export function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function formatMonthTitle(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function formatDayTitle(date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS_KO[date.getDay()]})`;
}

// 달력 그리드 — 일요일 시작 6주(42칸) 고정. 이전/다음 달 날짜도 채워서
// 칸이 비지 않게 한다.
export function getMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    return { date, inMonth: date.getMonth() === month };
  });
}

export function minutesToLabel(minutes) {
  if (!minutes || minutes <= 0) return '0분';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function formatClock(hour, minute) {
  return `${pad(hour)}:${pad(minute)}`;
}

// 최근 7일(오늘 포함) 오래된 순.
export function last7Days() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));
}

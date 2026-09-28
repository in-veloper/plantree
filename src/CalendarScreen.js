import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadow } from 'react-native-shadow-2';

import { colors, font, heatLevelFor, radius, shadowProps } from './theme';
import { WEEKDAYS_KO, formatMonthTitle, getMonthGrid, toKey, todayKey } from './date';
import DayAgenda, { DayHeader } from './DayAgenda';

const BUBBLE = 40;

const MAX_DOTS = 4;

export default function CalendarScreen({
  monthDate,
  onChangeMonth,
  logs,
  plans,
  selectedDateKey,
  onSelectDay,
  onAddPlan,
  onOpenTimeSheet,
  onEditPlan,
  onToggleDone,
}) {
  const grid = getMonthGrid(monthDate);
  const todayK = todayKey();

  // 그날 등록된(완료 안 한) 일정마다 과목 색으로 점을 하나씩 — 참고 화면처럼.
  const dotsByDate = {};
  for (const p of plans) {
    if (p.done) continue;
    const list = dotsByDate[p.dateKey] || (dotsByDate[p.dateKey] = []);
    if (list.length < MAX_DOTS) list.push(p.subject?.color || colors.textFaint);
  }

  const dayPlans = plans
    .filter((p) => p.dateKey === selectedDateKey)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  return (
    <View style={styles.root}>
      <Shadow {...shadowProps} stretch startColor="rgba(20, 53, 31, 0.10)" style={styles.calendarCard}>
        <View style={styles.header}>
          <Pressable onPress={() => onChangeMonth(-1)} hitSlop={10} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.textDim} />
          </Pressable>

          <Pressable onPress={() => onChangeMonth(0)} style={styles.titleWrap}>
            <Text style={styles.title}>{formatMonthTitle(monthDate)}</Text>
          </Pressable>

          <Pressable onPress={() => onChangeMonth(1)} hitSlop={10} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS_KO.map((w, i) => (
            <Text
              key={w}
              style={[
                styles.weekLabel,
                i === 0 && { color: colors.danger },
                i === 6 && { color: '#4E7CAE' },
              ]}
            >
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map(({ date, inMonth }) => {
            const key = toKey(date);
            const minutes = logs[key]?.minutes || 0;
            const level = heatLevelFor(minutes);
            const isToday = key === todayK;
            const isSelected = key === selectedDateKey;
            const dots = dotsByDate[key] || [];

            return (
              <Pressable key={key} onPress={() => onSelectDay(key)} style={styles.cellWrap}>
                <View
                  style={[
                    styles.bubble,
                    { backgroundColor: level.color === 'transparent' ? 'transparent' : level.color },
                    isToday && minutes <= 0 && !isSelected && styles.bubbleToday,
                    isToday && minutes > 0 && !isSelected && styles.bubbleTodayRing,
                    isSelected && styles.bubbleSelected,
                    !inMonth && { opacity: 0.32 },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      isSelected
                        ? { color: colors.onAccent }
                        : { color: minutes > 0 ? level.text : isToday ? colors.accent : colors.text },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
                {dots.length > 0 ? (
                  <View style={styles.dotRow} pointerEvents="none">
                    {dots.map((c, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Shadow>

      <DayHeader dateKey={selectedDateKey} />

      <ScrollView
        style={styles.lower}
        contentContainerStyle={styles.lowerContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DayAgenda
          dateKey={selectedDateKey}
          plans={dayPlans}
          onEditPlan={onEditPlan}
          onToggleDone={onToggleDone}
          onAddPlan={onAddPlan}
        />
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.fabRow}>
        <Shadow {...shadowProps} safeRender style={{ borderRadius: radius.pill }}>
          <Pressable
            onPress={onOpenTimeSheet}
            style={({ pressed }) => [styles.fab, styles.fabSecondary, pressed && styles.fabPressed]}
          >
            <Text style={styles.fabTextSecondary}>기록</Text>
          </Pressable>
        </Shadow>
        <Shadow {...shadowProps} safeRender startColor="rgba(31, 107, 66, 0.35)" style={{ borderRadius: radius.pill }}>
          <Pressable onPress={onAddPlan} style={({ pressed }) => [styles.fab, styles.fabPrimary, pressed && styles.fabPressed]}>
            <Text style={styles.fabTextPrimary}>일정</Text>
          </Pressable>
        </Shadow>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  titleWrap: { paddingHorizontal: 12, paddingVertical: 4 },
  title: { fontFamily: font.bold, fontSize: 17, color: colors.text },

  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.textFaint,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: {
    width: `${100 / 7}%`,
    aspectRatio: 0.88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bubbleToday: { backgroundColor: colors.accentSoft },
  bubbleTodayRing: { borderWidth: 1.5, borderColor: colors.accent },
  // 안드로이드에서 elevation 을 borderRadius 와 같이 주면 둥근 채움이
  // 아니라 네모로 잘려 보이는 경우가 있어(실제 기기에서 확인) 그림자 없이
  // 색만 채운다.
  bubbleSelected: { backgroundColor: colors.accent },
  cellText: { fontFamily: font.semibold, fontSize: 15 },
  // 점이 생겨도 위의 날짜 숫자(버블) 위치가 절대 안 밀리게, 점은 셀 바닥에
  // 따로 고정해 둔다 — flow 안에 같이 두면 있을 때/없을 때 버블이 오르락
  // 내리락한다.
  dotRow: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  lower: { flex: 1 },
  // 목록 카드의 그림자가 보일 정도로만 좌우 여백 — 달력 카드 쪽은 안 건드린다.
  lowerContent: { paddingHorizontal: 10 },

  fabRow: {
    position: 'absolute',
    right: 4,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fab: {
    paddingHorizontal: 20,
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPrimary: { backgroundColor: colors.accent },
  fabSecondary: { backgroundColor: colors.accentSoft },
  fabTextPrimary: { fontFamily: font.bold, fontSize: 14, color: colors.onAccent },
  fabTextSecondary: { fontFamily: font.bold, fontSize: 14, color: colors.accent },
  fabPressed: { transform: [{ scale: 0.96 }] },
});

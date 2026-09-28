import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadow } from 'react-native-shadow-2';

import { getLogFor, useLogs } from './store';
import { colors, font, radius, shadowProps } from './theme';
import { formatDayTitle, fromKey, minutesToLabel } from './date';

// 날짜 + 오늘 공부 시간 요약 — 달력 바로 아래 고정으로 붙어 있고, 목록만
// 스크롤될 때 같이 밀려 올라가면 안 되니 스크롤 영역 밖에서 따로 렌더링한다.
export function DayHeader({ dateKey }) {
  useLogs();
  if (!dateKey) return null;

  const date = fromKey(dateKey);
  const log = getLogFor(dateKey);

  return (
    <View style={styles.head}>
      <View>
        <Text style={styles.dateEyebrow}>선택한 날짜</Text>
        <Text style={styles.dateTitle}>{formatDayTitle(date)}</Text>
      </View>
      <View style={styles.timeChip}>
        <Ionicons name="time-outline" size={14} color={colors.accent} />
        <Text style={styles.timeChipText}>{minutesToLabel(log.minutes)}</Text>
      </View>
    </View>
  );
}

// 일정 목록 — 이 부분만 스크롤 영역 안에 들어간다.
export default function DayAgenda({ dateKey, plans, onEditPlan, onToggleDone, onAddPlan }) {
  if (!dateKey) return null;

  const doneCount = plans.filter((p) => p.done).length;

  return (
    <View>
      {plans.length > 0 ? (
        <View style={styles.listHead}>
          <Text style={styles.listTitle}>오늘의 플랜</Text>
          <Text style={styles.listCount}>{doneCount}/{plans.length} 완료</Text>
        </View>
      ) : null}

      {plans.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Ionicons name="calendar-clear-outline" size={21} color={colors.accent} /></View>
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>아직 등록된 플랜이 없어요</Text>
            <Text style={styles.emptyText}>작은 계획부터 하나씩 시작해 보세요.</Text>
          </View>
          <Pressable onPress={onAddPlan} style={styles.emptyAdd} hitSlop={8}>
            <Ionicons name="add" size={21} color={colors.onAccent} />
          </Pressable>
        </View>
      ) : null}

      {plans.map((p) => (
        <Shadow key={p.id} {...shadowProps} stretch containerStyle={styles.planRowContainer}>
          <Pressable onPress={() => onEditPlan(p)} style={styles.planRow}>
            <View style={[styles.planBar, { backgroundColor: p.subject?.color || colors.lineStrong }]} />

            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, p.done && styles.planTitleDone]} numberOfLines={1}>
                {p.title}
              </Text>
              <View style={styles.planMetaRow}>
                {p.subject ? <Text style={styles.subjectLabel}>{p.subject.label}</Text> : null}
                {p.time ? <Text style={styles.planMeta}>{p.time}</Text> : null}
                {p.reminder?.mode && p.reminder.mode !== 'none' ? (
                  <Ionicons name="notifications" size={12} color={colors.textFaint} />
                ) : null}
              </View>
            </View>

            <Pressable onPress={() => onToggleDone(p.id)} hitSlop={8}>
              <Ionicons
                name={p.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={p.done ? colors.success : colors.lineStrong}
              />
            </Pressable>
          </Pressable>
        </Shadow>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 14 },
  dateEyebrow: { fontFamily: font.semibold, fontSize: 11, color: colors.textFaint, marginBottom: 3 },
  dateTitle: { fontFamily: font.bold, fontSize: 17, color: colors.text },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  timeChipText: { fontFamily: font.semibold, fontSize: 12, color: colors.accent },

  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9, marginTop: 2 },
  listTitle: { fontFamily: font.bold, fontSize: 14, color: colors.text },
  listCount: { fontFamily: font.semibold, fontSize: 12, color: colors.textFaint },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface },
  emptyIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyCopy: { flex: 1 },
  emptyTitle: { fontFamily: font.semibold, fontSize: 13, color: colors.text },
  emptyText: { fontFamily: font.regular, fontSize: 11, color: colors.textFaint, marginTop: 3 },
  emptyAdd: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },

  planRowContainer: { marginBottom: 16 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
  },
  planBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  planTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
  planTitleDone: { color: colors.textFaint, textDecorationLine: 'line-through' },
  planMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  planMeta: { fontFamily: font.regular, fontSize: 12, color: colors.textFaint },
  subjectLabel: { fontFamily: font.semibold, fontSize: 12, color: colors.textDim },
});

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLogs, usePlans } from './store';
import { colors, font, radius } from './theme';
import { WEEKDAYS_KO, addDays, last7Days, minutesToLabel, toKey } from './date';
import { Card } from './ui';

function computeStreak(logs) {
  let streak = 0;
  let cursor = new Date();
  for (;;) {
    const key = toKey(cursor);
    const minutes = logs[key]?.minutes || 0;
    if (minutes <= 0) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function monthTotal(logs) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return Object.entries(logs).reduce((sum, [key, v]) => (key.startsWith(prefix) ? sum + v.minutes : sum), 0);
}

export default function StatsScreen() {
  const logs = useLogs();
  const plans = usePlans();
  const days = last7Days();
  const values = days.map((d) => logs[toKey(d)]?.minutes || 0);
  const max = Math.max(60, ...values);
  const streak = computeStreak(logs);
  const total = monthTotal(logs);
  const weekTotal = values.reduce((a, b) => a + b, 0);
  const studiedDays = values.filter((v) => v > 0).length;
  const weekKeys = new Set(days.map(toKey));
  const weekPlans = plans.filter((p) => weekKeys.has(p.dateKey));
  const completedPlans = weekPlans.filter((p) => p.done).length;
  const completionRate = weekPlans.length ? Math.round((completedPlans / weekPlans.length) * 100) : null;
  const bestDay = days[values.indexOf(Math.max(...values))];

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.statRow}>
        <Card style={styles.statCard} innerStyle={styles.statCardInner}>
          <Text style={styles.statValue}>{streak}일</Text>
          <Text style={styles.statLabel}>연속 기록</Text>
        </Card>
        <Card style={styles.statCard} innerStyle={styles.statCardInner}>
          <Text style={styles.statValue}>{minutesToLabel(total)}</Text>
          <Text style={styles.statLabel}>이번 달 누적</Text>
        </Card>
      </View>

      <Card style={styles.insightCard} innerStyle={styles.insightCardInner}>
        <View style={styles.insightHead}>
          <View style={styles.insightIcon}><Text style={styles.insightEmoji}>✦</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>이번 주 학습 리포트</Text>
            <Text style={styles.insightSub}>최근 7일의 흐름을 모았어요</Text>
          </View>
        </View>
        <View style={styles.insightMetrics}>
          <View style={styles.insightMetric}>
            <Text style={styles.metricValue}>{studiedDays}<Text style={styles.metricUnit}>일</Text></Text>
            <Text style={styles.metricLabel}>공부한 날</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.insightMetric}>
            <Text style={styles.metricValue}>{completionRate == null ? '–' : <>{completionRate}<Text style={styles.metricUnit}>%</Text></>}</Text>
            <Text style={styles.metricLabel}>플랜 완료율</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.insightMetric}>
            <Text style={styles.metricValue}>{values.some((v) => v > 0) ? WEEKDAYS_KO[bestDay.getDay()] : '–'}</Text>
            <Text style={styles.metricLabel}>가장 집중한 요일</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.chartCard}>
        <View style={styles.chartHead}>
          <Text style={styles.chartTitle}>최근 7일</Text>
          <Text style={styles.chartTotal}>{minutesToLabel(weekTotal)}</Text>
        </View>

        <View style={styles.barRow}>
          {days.map((d, i) => {
            const v = values[i];
            const h = v <= 0 ? 4 : Math.max(6, (v / max) * 96);
            const isToday = toKey(d) === toKey(new Date());
            return (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValue}>{v > 0 ? Math.round(v) : ''}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: h, backgroundColor: isToday ? colors.accent : colors.accentSoft },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && { color: colors.accent }]}>
                  {WEEKDAYS_KO[d.getDay()]}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // 카드가 꽉 채워지면 우측·하단 그림자가 나갈 자리가 없어서 스크롤뷰
  // 경계에 잘려 보인다 — 그림자가 나갈 수 있는 최대 폭보다 넉넉하게 준다.
  root: { flex: 1, paddingHorizontal: 12 },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1 },
  statCardInner: { gap: 6 },
  statValue: { fontFamily: font.bold, fontSize: 18, color: colors.text },
  statLabel: { fontFamily: font.regular, fontSize: 12, color: colors.textFaint },

  insightCard: { marginBottom: 16 },
  insightCardInner: { backgroundColor: '#F0F6EE' },
  insightHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  insightIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  insightEmoji: { color: colors.accent, fontSize: 18 },
  insightTitle: { fontFamily: font.bold, fontSize: 14, color: colors.text },
  insightSub: { fontFamily: font.regular, fontSize: 11, color: colors.textFaint, marginTop: 3 },
  insightMetrics: { flexDirection: 'row', alignItems: 'center' },
  insightMetric: { flex: 1, alignItems: 'center', gap: 4 },
  metricValue: { fontFamily: font.bold, fontSize: 19, color: colors.text },
  metricUnit: { fontFamily: font.semibold, fontSize: 12, color: colors.textDim },
  metricLabel: { fontFamily: font.regular, fontSize: 10, color: colors.textFaint, textAlign: 'center' },
  metricDivider: { width: 1, height: 28, backgroundColor: colors.lineStrong },

  chartCard: {},
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  chartTitle: { fontFamily: font.bold, fontSize: 15, color: colors.text },
  chartTotal: { fontFamily: font.semibold, fontSize: 13, color: colors.accent },

  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1, gap: 6 },
  barValue: { fontFamily: font.semibold, fontSize: 10, color: colors.textFaint, height: 12 },
  barTrack: { height: 96, justifyContent: 'flex-end' },
  bar: { width: 18, borderRadius: radius.sm },
  barLabel: { fontFamily: font.semibold, fontSize: 11, color: colors.textFaint },
});

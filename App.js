import { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as Font from 'expo-font';

import CalendarScreen from './src/CalendarScreen';
import PlanFormSheet from './src/PlanFormSheet';
import StatsScreen from './src/StatsScreen';
import StudyTimeSheet from './src/StudyTimeSheet';
import { addMonths, todayKey } from './src/date';
import { cancelReminders, prepareNotifications } from './src/notify';
import { getPlan, initStore, isStoreLoaded, togglePlanDone, useLogs, usePlans } from './src/store';
import { colors, font, radius } from './src/theme';

const TABS = [
  { key: 'calendar', label: '플랜' },
  { key: 'stats', label: '기록' },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('calendar');
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(() => todayKey());
  const [planForm, setPlanForm] = useState({ visible: false, dateKey: null, plan: null });
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);

  const plans = usePlans();
  const logs = useLogs();

  useEffect(() => {
    (async () => {
      await Promise.all([
        Font.loadAsync({
          'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.ttf'),
          'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.ttf'),
          'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.ttf'),
        }),
        initStore(),
        prepareNotifications(),
      ]);
      setReady(true);
    })();
  }, []);

  if (!ready || !isStoreLoaded()) return null;

  function changeMonth(delta) {
    if (delta === 0) {
      setMonthDate(new Date());
      setSelectedDayKey(todayKey());
      return;
    }
    setMonthDate((m) => addMonths(m, delta));
  }

  function openDay(dateKey) {
    setSelectedDayKey(dateKey);
  }

  function openAddPlan(dateKey) {
    setPlanForm({ visible: true, dateKey, plan: null });
  }

  function openEditPlan(plan) {
    setPlanForm({ visible: true, dateKey: plan.dateKey, plan });
  }

  // 완료로 표시하면 남은 반복 알림은 더 필요 없으니 같이 정리한다.
  async function handleToggleDone(id) {
    const plan = getPlan(id);
    if (plan && !plan.done) await cancelReminders(plan.notificationIds);
    togglePlanDone(id);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.body}>
        <View style={styles.tabs}>
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.content}>
          {tab === 'calendar' ? (
            <CalendarScreen
              monthDate={monthDate}
              onChangeMonth={changeMonth}
              logs={logs}
              plans={plans}
              selectedDateKey={selectedDayKey}
              onSelectDay={openDay}
              onAddPlan={() => openAddPlan(selectedDayKey)}
              onOpenTimeSheet={() => setTimeSheetOpen(true)}
              onEditPlan={openEditPlan}
              onToggleDone={handleToggleDone}
            />
          ) : (
            <StatsScreen />
          )}
        </View>
      </View>

      <PlanFormSheet
        visible={planForm.visible}
        dateKey={planForm.dateKey}
        plan={planForm.plan}
        onClose={() => setPlanForm({ visible: false, dateKey: null, plan: null })}
      />

      <StudyTimeSheet dateKey={selectedDayKey} visible={timeSheetOpen} onClose={() => setTimeSheetOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // RN 의 SafeAreaView 는 안드로이드에서 상태바 높이를 자동으로 안 빼 준다
  // (iOS 전용 동작) — 그대로 두면 헤더가 상태바에 바짝 붙는다.
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: Platform.OS === 'android' ? 20 : 12 },

  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontFamily: font.semibold, color: colors.textFaint, fontSize: 16 },
  tabTextActive: { fontFamily: font.bold, color: colors.onAccent },

  content: { flex: 1 },
});

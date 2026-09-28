import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { getLogFor, setStudyMinutes, useLogs } from './store';
import { colors, font } from './theme';
import { formatDayTitle, fromKey } from './date';
import { Button, Sheet, WheelPicker } from './ui';

const HOURS = Array.from({ length: 13 }, (_, i) => i); // 0~12시간
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 1분 단위

function pad(n) {
  return String(n).padStart(2, '0');
}

// 공부 시간 입력 — 더하는 방식이 아니라, 다이얼로 고른 시간이 그날의
// 기록이 된다. 수정하고 싶으면 다시 열어서 시간을 새로 고르고 저장하면
// 그 값으로 덮어써진다.
export default function StudyTimeSheet({ dateKey, visible, onClose }) {
  useLogs();
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);

  useEffect(() => {
    if (!visible || !dateKey) return;
    const minutes = getLogFor(dateKey).minutes || 0;
    setH(Math.min(12, Math.floor(minutes / 60)));
    setM(minutes % 60);
  }, [visible, dateKey]);

  if (!dateKey) return null;

  const date = fromKey(dateKey);

  function submit() {
    setStudyMinutes(dateKey, h * 60 + m);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  }

  return (
    <Sheet visible={visible} title={formatDayTitle(date)} onClose={onClose}>
      <View style={styles.dialRow}>
        <View style={styles.dialGroup}>
          <WheelPicker values={HOURS} value={h} onChange={setH} format={pad} />
          <Text style={styles.dialUnit}>시간</Text>
        </View>
        <Text style={styles.dialColon}>:</Text>
        <View style={styles.dialGroup}>
          <WheelPicker values={MINUTES} value={m} onChange={setM} format={pad} />
          <Text style={styles.dialUnit}>분</Text>
        </View>
      </View>
      <Button label="이 시간으로 기록하기" onPress={submit} />

      <View style={{ height: 12 }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  dialRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 },
  dialGroup: { alignItems: 'center' },
  dialColon: { fontFamily: font.bold, fontSize: 20, color: colors.textFaint, marginTop: -14 },
  dialUnit: { fontFamily: font.regular, fontSize: 12, color: colors.textFaint, marginTop: 2 },
});

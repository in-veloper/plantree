import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { addSubject, createPlanId, deletePlan as storeDeletePlan, upsertPlan, useSubjects } from './store';
import { cancelReminders, scheduleReminder } from './notify';
import { colors, font, radius, TAG_COLORS } from './theme';
import { formatDayTitle, fromKey } from './date';
import { Button, Chip, Sheet, Stepper } from './ui';

const REPEAT_INTERVALS = [
  { label: '30분마다', value: 30 },
  { label: '1시간마다', value: 60 },
  { label: '2시간마다', value: 120 },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function clampHour(h) {
  return ((h % 24) + 24) % 24;
}
function clampMinute(m) {
  return ((m % 60) + 60) % 60;
}

// 메멘토 알람 화면과 같은 다이얼 스테퍼 — 위/아래 화살표를 누르거나 꾹
// 눌러서 시:분을 맞춘다.
function TimeStepper({ value, onChange }) {
  const [h, m] = value.split(':').map(Number);

  return (
    <View style={ts.row}>
      <Stepper big value={h} onChange={(next) => onChange(`${pad(next)}:${pad(m)}`)} wrap={clampHour} format={pad} />
      <Text style={ts.colon}>:</Text>
      <Stepper
        big
        value={m}
        onChange={(next) => onChange(`${pad(h)}:${pad(next)}`)}
        wrap={clampMinute}
        format={pad}
      />
    </View>
  );
}

const REMINDER_MODES = [
  { key: 'none', label: '안 받음' },
  { key: 'once', label: '한 번' },
  { key: 'repeat', label: '반복' },
];

export default function PlanFormSheet({ visible, dateKey, plan, onClose }) {
  const isEdit = !!plan;
  const subjects = useSubjects();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(null); // { label, color } | null
  const [newSubjectOpen, setNewSubjectOpen] = useState(false);
  const [newSubjectLabel, setNewSubjectLabel] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(TAG_COLORS[0].color);
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState('18:00');
  const [reminderMode, setReminderMode] = useState('none');
  const [reminderTime, setReminderTime] = useState('18:00');
  const [repeatUntil, setRepeatUntil] = useState('21:00');
  const [repeatEvery, setRepeatEvery] = useState(60);

  useEffect(() => {
    if (!visible) return;
    setNewSubjectOpen(false);
    setNewSubjectLabel('');
    setNewSubjectColor(TAG_COLORS[0].color);
    if (plan) {
      setTitle(plan.title);
      setSubject(plan.subject || null);
      setHasTime(!!plan.time);
      setTime(plan.time || '18:00');
      setReminderMode(plan.reminder?.mode || 'none');
      setReminderTime(plan.reminder?.time || plan.time || '18:00');
      setRepeatUntil(plan.reminder?.repeatUntil || '21:00');
      setRepeatEvery(plan.reminder?.repeatEveryMin || 60);
    } else {
      setTitle('');
      setSubject(null);
      setHasTime(false);
      setTime('18:00');
      setReminderMode('none');
      setReminderTime('18:00');
      setRepeatUntil('21:00');
      setRepeatEvery(60);
    }
  }, [visible, plan]);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('제목을 입력해 주세요');
      return;
    }

    if (isEdit) {
      await cancelReminders(plan.notificationIds);
    }

    const reminder =
      reminderMode === 'none'
        ? { mode: 'none' }
        : reminderMode === 'once'
        ? { mode: 'once', time: reminderTime }
        : { mode: 'repeat', time: reminderTime, repeatUntil, repeatEveryMin: repeatEvery };

    const draft = {
      id: isEdit ? plan.id : createPlanId(),
      title: trimmed,
      subject,
      dateKey,
      time: hasTime ? time : null,
      reminder,
      notificationIds: [],
      done: isEdit ? plan.done : false,
      createdAt: isEdit ? plan.createdAt : Date.now(),
    };

    const notificationIds = await scheduleReminder(draft);
    upsertPlan({ ...draft, notificationIds });
    onClose();
  }

  async function handleDelete() {
    if (!isEdit) return;
    await cancelReminders(plan.notificationIds);
    storeDeletePlan(plan.id);
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      title={dateKey ? formatDayTitle(fromKey(dateKey)) : ''}
      onClose={onClose}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>제목</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="예: 수학 3단원 문제풀이"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />

        <Text style={styles.label}>과목</Text>
        <View style={styles.subjectRow}>
          {subjects.map((s) => {
            const active = subject?.label === s.label && subject?.color === s.color;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSubject(active ? null : { label: s.label, color: s.color })}
                style={[styles.subjectChip, active && { backgroundColor: s.color, borderColor: s.color }]}
              >
                <View style={[styles.subjectChipDot, { backgroundColor: active ? colors.onAccent : s.color }]} />
                <Text style={[styles.subjectChipText, active && { color: colors.onAccent }]}>{s.label}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setNewSubjectOpen((v) => !v)} style={styles.subjectAddChip}>
            <Ionicons name={newSubjectOpen ? 'close' : 'add'} size={15} color={colors.textDim} />
            <Text style={styles.subjectChipText}>새 과목</Text>
          </Pressable>
        </View>

        {newSubjectOpen ? (
          <View style={styles.newSubjectBlock}>
            <TextInput
              value={newSubjectLabel}
              onChangeText={setNewSubjectLabel}
              placeholder="예: 노동법"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, { marginBottom: 12 }]}
            />
            <View style={styles.colorRow}>
              {TAG_COLORS.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => setNewSubjectColor(c.color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c.color },
                    newSubjectColor === c.color && styles.colorDotActive,
                  ]}
                />
              ))}
            </View>
            <Button
              label="이 과목 등록하기"
              variant="soft"
              onPress={() => {
                const label = newSubjectLabel.trim();
                if (!label) return;
                const created = addSubject(label, newSubjectColor);
                setSubject({ label: created.label, color: created.color });
                setNewSubjectOpen(false);
                setNewSubjectLabel('');
              }}
            />
          </View>
        ) : null}

        <View style={styles.rowHead}>
          <Text style={styles.label}>시간 지정</Text>
          <Chip label={hasTime ? '켜짐' : '꺼짐'} active={hasTime} onPress={() => setHasTime((v) => !v)} />
        </View>
        {hasTime ? <TimeStepper value={time} onChange={setTime} /> : null}

        <Text style={[styles.label, { marginTop: 18 }]}>알림</Text>
        <View style={styles.chipRow}>
          {REMINDER_MODES.map((m) => (
            <Chip key={m.key} label={m.label} active={reminderMode === m.key} onPress={() => setReminderMode(m.key)} />
          ))}
        </View>

        {reminderMode === 'once' ? (
          <View style={styles.reminderBlock}>
            <Text style={styles.subLabel}>알려줄 시각</Text>
            <TimeStepper value={reminderTime} onChange={setReminderTime} />
          </View>
        ) : null}

        {reminderMode === 'repeat' ? (
          <View style={styles.reminderBlock}>
            <Text style={styles.subLabel}>시작 시각</Text>
            <TimeStepper value={reminderTime} onChange={setReminderTime} />
            <Text style={[styles.subLabel, { marginTop: 12 }]}>종료 시각</Text>
            <TimeStepper value={repeatUntil} onChange={setRepeatUntil} />
            <Text style={[styles.subLabel, { marginTop: 12 }]}>반복 간격</Text>
            <View style={styles.chipRow}>
              {REPEAT_INTERVALS.map((r) => (
                <Chip key={r.value} label={r.label} active={repeatEvery === r.value} onPress={() => setRepeatEvery(r.value)} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: 22 }} />
        <Button label={isEdit ? '수정 완료' : '추가하기'} onPress={handleSave} />
        {isEdit ? (
          <View style={{ marginTop: 10 }}>
            <Button label="일정 삭제" variant="danger" onPress={handleDelete} />
          </View>
        ) : null}
        <View style={{ height: 12 }} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.textDim, marginBottom: 8 },
  subLabel: { fontFamily: font.semibold, fontSize: 12, color: colors.textFaint, marginBottom: 8 },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },

  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  subjectChipDot: { width: 7, height: 7, borderRadius: 4 },
  subjectChipText: { fontFamily: font.semibold, fontSize: 13, color: colors.textDim },
  subjectAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  newSubjectBlock: { marginBottom: 14, padding: 14, backgroundColor: colors.surfaceSoft, borderRadius: radius.md },

  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reminderBlock: { marginTop: 14, padding: 14, backgroundColor: colors.surfaceSoft, borderRadius: radius.md },
});

const ts = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  colon: { fontFamily: font.bold, fontSize: 30, color: colors.textFaint, marginTop: -4 },
});

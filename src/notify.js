import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { fromKey } from './date';

const CHANNEL_ID = 'study-plan';
const MAX_REPEAT_COUNT = 20; // 폭주 방지 — 반복 알림도 최대 이만큼만 건다.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let ready = null;

export function prepareNotifications() {
  if (ready) return ready;

  ready = (async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: '공부 일정',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  })();

  return ready;
}

function timeToParts(time) {
  const [h, m] = time.split(':').map(Number);
  return { h, m };
}

async function scheduleAt(date, content) {
  if (date.getTime() <= Date.now()) return null;
  try {
    await prepareNotifications();
    return await Notifications.scheduleNotificationAsync({
      content: { ...content, sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

// plan.reminder = { mode: 'none' | 'once' | 'repeat', time, repeatEveryMin, repeatUntil }
// 기존 예약이 있으면 먼저 정리하고 새로 건다 — 반환값을 plan.notificationIds 에 저장해 두면 된다.
export async function scheduleReminder(plan) {
  const reminder = plan.reminder;
  if (!reminder || reminder.mode === 'none') return [];

  const day = fromKey(plan.dateKey);
  const title = plan.title || '공부할 시간이에요';
  const body = plan.subject?.label ? `${plan.subject.label} · 등록해 둔 공부 일정이에요` : '등록해 둔 공부 일정이에요';

  if (reminder.mode === 'once') {
    const { h, m } = timeToParts(reminder.time);
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
    const id = await scheduleAt(at, { title, body });
    return id ? [id] : [];
  }

  // repeat: 시작 시각부터 종료 시각까지 간격마다 한 번씩.
  const { h: sh, m: sm } = timeToParts(reminder.time);
  const { h: eh, m: em } = timeToParts(reminder.repeatUntil);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, sm, 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em, 0, 0);
  const stepMs = Math.max(5, reminder.repeatEveryMin || 60) * 60 * 1000;

  const ids = [];
  let at = start.getTime();
  let count = 0;
  while (at <= end.getTime() && count < MAX_REPEAT_COUNT) {
    const id = await scheduleAt(new Date(at), { title, body });
    if (id) ids.push(id);
    at += stepMs;
    count += 1;
  }
  return ids;
}

export async function cancelReminders(ids) {
  if (!ids || !ids.length) return;
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined))
  );
}

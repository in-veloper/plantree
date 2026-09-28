import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const PLANS_KEY = 'studyplan/plans';
const LOGS_KEY = 'studyplan/logs';
const SUBJECTS_KEY = 'studyplan/subjects';

let plans = [];
let logs = {}; // { [dateKey]: { minutes: number } }
let subjects = []; // [{ id, label, color }] — 한 번 등록해 두고 일정마다 골라 쓴다.
let loaded = false;
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function persistPlans() {
  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plans)).catch(() => undefined);
}

async function persistLogs() {
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs)).catch(() => undefined);
}

async function persistSubjects() {
  await AsyncStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)).catch(() => undefined);
}

export async function initStore() {
  if (loaded) return;
  try {
    const [rawPlans, rawLogs, rawSubjects] = await Promise.all([
      AsyncStorage.getItem(PLANS_KEY),
      AsyncStorage.getItem(LOGS_KEY),
      AsyncStorage.getItem(SUBJECTS_KEY),
    ]);
    plans = rawPlans ? JSON.parse(rawPlans) : [];
    logs = rawLogs ? JSON.parse(rawLogs) : {};
    subjects = rawSubjects ? JSON.parse(rawSubjects) : [];
  } catch {
    plans = [];
    logs = {};
    subjects = [];
  }
  loaded = true;
  emit();
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePlans() {
  return useSyncExternalStore(subscribe, () => plans);
}

export function useLogs() {
  return useSyncExternalStore(subscribe, () => logs);
}

export function isStoreLoaded() {
  return loaded;
}

export function getPlan(id) {
  return plans.find((p) => p.id === id) || null;
}

export function upsertPlan(plan) {
  const existingIndex = plans.findIndex((p) => p.id === plan.id);
  if (existingIndex >= 0) {
    plans = plans.map((p, i) => (i === existingIndex ? plan : p));
  } else {
    plans = [...plans, plan];
  }
  persistPlans();
  emit();
}

export function deletePlan(id) {
  plans = plans.filter((p) => p.id !== id);
  persistPlans();
  emit();
}

export function togglePlanDone(id) {
  plans = plans.map((p) => (p.id === id ? { ...p, done: !p.done } : p));
  persistPlans();
  emit();
}

export function createPlanId() {
  return uid();
}

// 더해나가는 방식이 아니라, 다이얼에서 고른 시간을 그날의 최종 기록으로
// 그대로 덮어쓴다 — 수정하고 싶으면 그냥 다시 골라서 저장하면 된다.
export function setStudyMinutes(dateKey, minutes) {
  logs = { ...logs, [dateKey]: { minutes } };
  persistLogs();
  emit();
}

export function getLogFor(dateKey) {
  return logs[dateKey] || { minutes: 0 };
}

export function useSubjects() {
  return useSyncExternalStore(subscribe, () => subjects);
}

export function addSubject(label, color) {
  const subject = { id: uid(), label, color };
  subjects = [...subjects, subject];
  persistSubjects();
  emit();
  return subject;
}

export function deleteSubject(id) {
  subjects = subjects.filter((s) => s.id !== id);
  persistSubjects();
  emit();
}

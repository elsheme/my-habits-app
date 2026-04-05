import AsyncStorage from "@react-native-async-storage/async-storage";
import { Habit, DailyLog, WeeklyStats, MonthlyStats, AppSettings } from "../types";

// ─────────────────────────────────────────────
// Keys
// ─────────────────────────────────────────────
const KEYS = {
  habits: "@habits",
  dailyLog: (date: string) => `@dailyLog:${date}`,
  weeklyCache: (weekKey: string) => `@weeklyCache:${weekKey}`,
  monthlyCache: (monthKey: string) => `@monthlyCache:${monthKey}`,
  settings: "@settings",
} as const;

// ─────────────────────────────────────────────
// Habits
// ─────────────────────────────────────────────
export async function getHabits(): Promise<Habit[]> {
  const raw = await AsyncStorage.getItem(KEYS.habits);
  return raw ? JSON.parse(raw) : [];
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.habits, JSON.stringify(habits));
}

// ─────────────────────────────────────────────
// Daily Log
// ─────────────────────────────────────────────
export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const raw = await AsyncStorage.getItem(KEYS.dailyLog(date));
  return raw ? JSON.parse(raw) : null;
}

export async function saveDailyLog(log: DailyLog): Promise<void> {
  await AsyncStorage.setItem(KEYS.dailyLog(log.date), JSON.stringify(log));
}

// ─────────────────────────────────────────────
// Weekly Cache
// ─────────────────────────────────────────────
export async function getWeeklyCache(weekKey: string): Promise<WeeklyStats | null> {
  const raw = await AsyncStorage.getItem(KEYS.weeklyCache(weekKey));
  return raw ? JSON.parse(raw) : null;
}

export async function saveWeeklyCache(stats: WeeklyStats): Promise<void> {
  await AsyncStorage.setItem(KEYS.weeklyCache(stats.weekKey), JSON.stringify(stats));
}

// ─────────────────────────────────────────────
// Monthly Cache
// ─────────────────────────────────────────────
export async function getMonthlyCache(monthKey: string): Promise<MonthlyStats | null> {
  const raw = await AsyncStorage.getItem(KEYS.monthlyCache(monthKey));
  return raw ? JSON.parse(raw) : null;
}

export async function saveMonthlyCache(stats: MonthlyStats): Promise<void> {
  await AsyncStorage.setItem(KEYS.monthlyCache(stats.monthKey), JSON.stringify(stats));
}

// ─────────────────────────────────────────────
// App Settings
// ─────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  const defaults: AppSettings = {
    notificationsEnabled: true,
    theme: "auto",
    onboardingCompleted: false,
  };
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify({ ...current, ...settings }));
}

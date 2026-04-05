import { Habit } from "../types";
import * as Crypto from "expo-crypto"; // استيراد التشفير من إكسبو

export const DEFAULT_HABITS: Omit<Habit, "id" | "createdAt">[] = [
  {
    name: "أذكار الصباح",
    icon: "🌅",
    isDefault: true,
    isActive: true,
    color: "#F39C12",
    notification: {
      enabled: true,
      time: { hour: 5, minute: 30 },
      triggerType: "daily",
    },
  },
  {
    name: "أذكار المساء",
    icon: "🌇",
    isDefault: true,
    isActive: true,
    color: "#E67E22",
    notification: {
      enabled: true,
      time: { hour: 16, minute: 30 },
      triggerType: "daily",
    },
  },
  {
    name: "الصلوات الخمس",
    icon: "🕌",
    isDefault: true,
    isActive: true,
    color: "#148F77",
    notification: {
      enabled: true,
      time: { hour: 12, minute: 0 },
      triggerType: "daily",
    },
  },
  {
    name: "السنن الرواتب",
    icon: "📿",
    isDefault: true,
    isActive: true,
    color: "#1ABC9C",
    notification: {
      enabled: true,
      time: { hour: 12, minute: 10 },
      triggerType: "daily",
    },
  },
  {
    name: "ركعتا الضحى",
    icon: "☀️",
    isDefault: true,
    isActive: true,
    color: "#F1C40F",
    notification: {
      enabled: true,
      time: { hour: 9, minute: 0 },
      triggerType: "daily",
    },
  },
  {
    name: "ركعة الوتر",
    icon: "🌙",
    isDefault: true,
    isActive: true,
    color: "#2C3E50",
    notification: {
      enabled: true,
      time: { hour: 23, minute: 30 },
      triggerType: "daily",
    },
  },
  {
    name: "نصف جزء قرآن",
    icon: "📖",
    isDefault: true,
    isActive: true,
    color: "#27AE60",
    notification: {
      enabled: true,
      time: { hour: 6, minute: 15 },
      triggerType: "daily",
    },
  },
  {
    name: "ساعة طالب علم",
    icon: "📚",
    isDefault: true,
    isActive: true,
    color: "#8E44AD",
    notification: {
      enabled: true,
      time: { hour: 21, minute: 30 },
      triggerType: "daily",
    },
  },
];

export function buildDefaultHabits(): Habit[] {
  const today = new Date().toISOString().split("T")[0];
  return DEFAULT_HABITS.map((h) => ({
    ...h,
    // استخدام الوظيفة المدمجة لتوليد المعرف الفريد
    id: Crypto.randomUUID(), 
    createdAt: today,
  }));
}
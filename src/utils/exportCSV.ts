import AsyncStorage from "@react-native-async-storage/async-storage";
import { Share, Platform } from "react-native";
import { DailyLog, Habit } from "../types";
import { subDays, format } from "date-fns";

// ─────────────────────────────────────────────
// Export last 60 days as CSV and open Share sheet
// ─────────────────────────────────────────────
export async function exportCSV(habits: Habit[]): Promise<void> {
  // 1. Collect all @dailyLog keys from AsyncStorage
  const allKeys = await AsyncStorage.getAllKeys();
  const logKeys = allKeys
    .filter((k) => k.startsWith("@dailyLog:"))
    .sort()
    .reverse()
    .slice(0, 60); // last 60 days max

  // 2. Fetch logs
  const rawLogs = await AsyncStorage.multiGet(logKeys);
  const logs: DailyLog[] = rawLogs
    .map(([, val]) => (val ? JSON.parse(val) : null))
    .filter(Boolean) as DailyLog[];

  if (logs.length === 0) {
    throw new Error("لا توجد بيانات للتصدير");
  }

  // 3. Build CSV headers
  const activeHabits = habits.filter((h) => h.isActive);
  const headers = ["التاريخ", "نسبة الإتمام", ...activeHabits.map((h) => `${h.icon} ${h.name}`)];

  // 4. Build rows
  const rows = logs.map((log) => {
    const rate = `${Math.round(log.completionRate * 100)}%`;
    const cols = activeHabits.map((h) => (log.logs[h.id] ? "✓" : "✗"));
    return [log.date, rate, ...cols];
  });

  // 5. Assemble CSV string (BOM for Excel Arabic support)
  const BOM = "\uFEFF";
  const csvContent =
    BOM +
    [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  // 6. Share via native sheet
  const filename = `habits_export_${format(new Date(), "yyyy-MM-dd")}.csv`;

  await Share.share(
    {
      title: "تصدير بيانات العادات",
      message: Platform.OS === "android" ? csvContent : undefined,
      url: Platform.OS === "ios" ? `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}` : undefined,
    },
    { dialogTitle: "حفظ أو مشاركة ملف CSV" }
  );
}

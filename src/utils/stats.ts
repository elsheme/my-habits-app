import { subDays, format, parseISO, getDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DailyLog, Habit } from '../types';

export interface HabitStats {
  habitId: string;
  completedDays: number;
  totalDays: number;
  rate: number; // 0-1
}

export interface HeatmapCell {
  date: string;
  rate: number; // 0-1
  level: 0 | 1 | 2 | 3 | 4; // 0=none, 1=weak, 2=mid, 3=good, 4=perfect
}

export type DayOfWeek = 'السبت' | 'الأحد' | 'الاثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة';

const DAY_NAMES: DayOfWeek[] = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// ─────────────────────────────────────────────
// Streak — أيام متتالية لعادة معينة
// ─────────────────────────────────────────────
export function calculateStreak(habitId: string, logs: DailyLog[]): number {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let expected = format(new Date(), 'yyyy-MM-dd');

  for (const log of sorted) {
    if (log.date !== expected) break;
    if (!log.logs[habitId]) break;
    streak++;
    expected = format(subDays(parseISO(log.date), 1), 'yyyy-MM-dd');
  }
  return streak;
}

// ─────────────────────────────────────────────
// Longest Streak in a date range
// ─────────────────────────────────────────────
export function calculateLongestStreak(habitId: string, logs: DailyLog[]): number {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let current = 0;
  let prevDate: string | null = null;

  for (const log of sorted) {
    if (!log.logs[habitId]) { current = 0; prevDate = null; continue; }
    if (prevDate) {
      const diff = (parseISO(log.date).getTime() - parseISO(prevDate).getTime()) / 86400000;
      current = diff === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prevDate = log.date;
  }
  return longest;
}

// ─────────────────────────────────────────────
// Weekly completion rate per habit
// ─────────────────────────────────────────────
export function weeklyCompletionRate(weekLogs: DailyLog[]): HabitStats[] {
  if (!weekLogs.length) return [];
  const habitIds = Object.keys(weekLogs[0].logs);
  return habitIds.map((habitId) => {
    const completed = weekLogs.filter((l) => l.logs[habitId] === true).length;
    return {
      habitId,
      completedDays: completed,
      totalDays: weekLogs.length,
      rate: weekLogs.length > 0 ? completed / weekLogs.length : 0,
    };
  });
}

// ─────────────────────────────────────────────
// Best day in a week (most habits completed)
// ─────────────────────────────────────────────
export function getBestDay(weekLogs: DailyLog[]): DayOfWeek | null {
  if (!weekLogs.length) return null;
  const best = weekLogs.reduce((prev, curr) =>
    curr.completionRate > prev.completionRate ? curr : prev
  );
  const dayIndex = getDay(parseISO(best.date));
  return DAY_NAMES[dayIndex];
}

// ─────────────────────────────────────────────
// Best & worst habit in a month
// ─────────────────────────────────────────────
export function getMonthlyTopBottom(
  monthLogs: DailyLog[],
  habits: Habit[]
): { best: Habit | null; worst: Habit | null } {
  if (!monthLogs.length || !habits.length) return { best: null, worst: null };

  const stats = weeklyCompletionRate(monthLogs); // reuse same logic
  if (!stats.length) return { best: null, worst: null };

  const sorted = [...stats].sort((a, b) => b.rate - a.rate);
  const bestId = sorted[0].habitId;
  const worstId = sorted[sorted.length - 1].habitId;

  return {
    best: habits.find((h) => h.id === bestId) ?? null,
    worst: habits.find((h) => h.id === worstId) ?? null,
  };
}

// ─────────────────────────────────────────────
// Heatmap data for a full month
// ─────────────────────────────────────────────
export function generateHeatmapData(monthLogs: DailyLog[], year: number, month: number): HeatmapCell[] {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day of month
  const days = eachDayOfInterval({ start, end });
  const logMap = new Map(monthLogs.map((l) => [l.date, l]));

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logMap.get(dateStr);
    const rate = log?.completionRate ?? 0;
    let level: HeatmapCell['level'] = 0;
    if (rate === 0) level = 0;
    else if (rate < 0.5) level = 1;
    else if (rate < 0.75) level = 2;
    else if (rate < 1) level = 3;
    else level = 4;
    return { date: dateStr, rate, level };
  });
}

// ─────────────────────────────────────────────
// Friday harvest message
// ─────────────────────────────────────────────
export function buildFridayHarvestMessage(
  weekLogs: DailyLog[],
  habits: Habit[]
): string {
  const stats = weeklyCompletionRate(weekLogs);
  const totalRate = weekLogs.reduce((s, l) => s + l.completionRate, 0) / (weekLogs.length || 1);
  const best = [...stats].sort((a, b) => b.rate - a.rate)[0];
  const bestHabit = habits.find((h) => h.id === best?.habitId);
  const completedHabits = stats.filter((s) => s.rate >= 0.5).length;

  return (
    `📊 حصاد أسبوعك — الجمعة\n\n` +
    `هذا الأسبوع أتممت ${completedHabits} من أصل ${habits.length} عادة\n\n` +
    `أفضل عادة: ${bestHabit ? bestHabit.icon + ' ' + bestHabit.name : '—'} ⭐\n\n` +
    `نسبة الإتمام الإجمالية: ${Math.round(totalRate * 100)}%\n\n` +
    `افتح التطبيق لعرض التفاصيل الكاملة 📱`
  );
}

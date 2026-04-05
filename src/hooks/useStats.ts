import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { getDailyLog, getWeeklyCache, saveWeeklyCache, getMonthlyCache, saveMonthlyCache } from '../utils/storage';
import { DailyLog, WeeklyStats, MonthlyStats } from '../types';
import { useHabitsStore } from '../store/habitsStore';
import {
  weeklyCompletionRate,
  getBestDay,
  calculateStreak,
  calculateLongestStreak,
  generateHeatmapData,
  getMonthlyTopBottom,
  buildFridayHarvestMessage,
  HabitStats,
  HeatmapCell,
} from '../utils/stats';

// ─────────────────────────────────────────────
// useWeeklyStats
// ─────────────────────────────────────────────
export function useWeeklyStats(weekStart?: Date) {
  const { habits } = useHabitsStore();
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [bestDay, setBestDay] = useState<string | null>(null);
  const [harvestMessage, setHarvestMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const baseDate = weekStart ?? new Date();
  const start = startOfWeek(baseDate, { weekStartsOn: 6 }); // Saturday
  const end = endOfWeek(baseDate, { weekStartsOn: 6 });
  const weekKey = format(start, 'yyyy-ww');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const days = eachDayOfInterval({ start, end });
      const logs: DailyLog[] = [];

      for (const day of days) {
        const log = await getDailyLog(format(day, 'yyyy-MM-dd'));
        if (log) logs.push(log);
      }

      setWeekLogs(logs);
      setHabitStats(weeklyCompletionRate(logs));
      setBestDay(getBestDay(logs));
      setHarvestMessage(buildFridayHarvestMessage(logs, habits));
      setLoading(false);
    }
    load();
  }, [weekKey, habits.length]);

  const streaks = habits.map((h) => ({
    habitId: h.id,
    streak: calculateStreak(h.id, weekLogs),
  }));

  return { weekLogs, habitStats, bestDay, harvestMessage, streaks, loading };
}

// ─────────────────────────────────────────────
// useMonthlyStats
// ─────────────────────────────────────────────
export function useMonthlyStats(year?: number, month?: number) {
  const { habits } = useHabitsStore();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;

  const [monthLogs, setMonthLogs] = useState<DailyLog[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [totalRate, setTotalRate] = useState(0);
  const [bestHabit, setBestHabit] = useState<string | null>(null);
  const [worstHabit, setWorstHabit] = useState<string | null>(null);
  const [longestStreaks, setLongestStreaks] = useState<{ habitId: string; streak: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = `${y}-${String(m).padStart(2, '0')}`;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const start = startOfMonth(new Date(y, m - 1));
      const end = endOfMonth(new Date(y, m - 1));
      const days = eachDayOfInterval({ start, end });
      const logs: DailyLog[] = [];

      for (const day of days) {
        const log = await getDailyLog(format(day, 'yyyy-MM-dd'));
        if (log) logs.push(log);
      }

      setMonthLogs(logs);
      setHeatmap(generateHeatmapData(logs, y, m));

      const avg = logs.length
        ? logs.reduce((s, l) => s + l.completionRate, 0) / logs.length
        : 0;
      setTotalRate(avg);

      const { best, worst } = getMonthlyTopBottom(logs, habits);
      setBestHabit(best ? `${best.icon} ${best.name}` : null);
      setWorstHabit(worst ? `${worst.icon} ${worst.name}` : null);
      interface h {abitId: string; streak: number }[];
      const streaks = habits.map((h) => ({
        habitId: h.id,
        streak: calculateLongestStreak(h.id, logs),
      }));
      setLongestStreaks(streaks);
      setLoading(false);
    }
    load();
  }, [monthKey, habits.length]);

  return { monthLogs, heatmap, totalRate, bestHabit, worstHabit, longestStreaks, loading };
}

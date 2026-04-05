import { create } from "zustand";
import { Habit, DailyLog } from "../types";
import { getHabits, saveHabits, getDailyLog, saveDailyLog } from "../utils/storage";
import { scheduleHabitNotification, cancelHabitNotification } from "../utils/notifications";
import { format } from "date-fns";

interface HabitsState {
  habits: Habit[];
  todayLog: DailyLog | null;
  isLoading: boolean;

  loadHabits: () => Promise<void>;
  loadTodayLog: () => Promise<void>;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  reorderHabits: (newOrder: Habit[]) => Promise<void>;
  initWithDefaultHabits: (habits: Habit[]) => Promise<void>;
}

const TODAY = format(new Date(), "yyyy-MM-dd");

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  todayLog: null,
  isLoading: true,

  loadHabits: async () => {
    const habits = await getHabits();
    set({ habits, isLoading: false });
  },

  loadTodayLog: async () => {
    const log = await getDailyLog(TODAY);
    if (log) {
      set({ todayLog: log });
    } else {
      const { habits } = get();
      const emptyLog: DailyLog = {
        date: TODAY,
        logs: Object.fromEntries(habits.filter((h) => h.isActive).map((h) => [h.id, false])),
        completionRate: 0,
      };
      set({ todayLog: emptyLog });
    }
  },

  addHabit: async (habit) => {
    const habits = [...get().habits, habit];
    await saveHabits(habits);
    set({ habits });
    if (habit.notification.enabled) {
      await scheduleHabitNotification(habit);
    }
    const log = get().todayLog;
    if (log) {
      const updated: DailyLog = { ...log, logs: { ...log.logs, [habit.id]: false } };
      await saveDailyLog(updated);
      set({ todayLog: updated });
    }
  },

  updateHabit: async (habit) => {
    const habits = get().habits.map((h) => (h.id === habit.id ? habit : h));
    await saveHabits(habits);
    set({ habits });
    await cancelHabitNotification(habit.id);
    if (habit.isActive && habit.notification.enabled) {
      await scheduleHabitNotification(habit);
    }
  },

  deleteHabit: async (habitId) => {
    const habits = get().habits.filter((h) => h.id !== habitId);
    await saveHabits(habits);
    set({ habits });
    await cancelHabitNotification(habitId);
    const log = get().todayLog;
    if (log) {
      const { [habitId]: _, ...rest } = log.logs;
      const active = Object.values(rest);
      const completionRate = active.length > 0 ? active.filter(Boolean).length / active.length : 0;
      const updated: DailyLog = { ...log, logs: rest, completionRate };
      await saveDailyLog(updated);
      set({ todayLog: updated });
    }
  },

  toggleHabit: async (habitId) => {
    const log = get().todayLog;
    if (!log) return;
    const updatedLogs = { ...log.logs, [habitId]: !log.logs[habitId] };
    const values = Object.values(updatedLogs);
    const completionRate = values.length > 0 ? values.filter(Boolean).length / values.length : 0;
    const updated: DailyLog = { ...log, logs: updatedLogs, completionRate };
    await saveDailyLog(updated);
    set({ todayLog: updated });
  },

  reorderHabits: async (newOrder) => {
    await saveHabits(newOrder);
    set({ habits: newOrder });
  },

  initWithDefaultHabits: async (habits) => {
    await saveHabits(habits);
    const emptyLog: DailyLog = {
      date: TODAY,
      logs: Object.fromEntries(habits.filter((h) => h.isActive).map((h) => [h.id, false])),
      completionRate: 0,
    };
    await saveDailyLog(emptyLog);
    set({ habits, todayLog: emptyLog, isLoading: false });
  },
}));

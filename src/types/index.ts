export interface HabitNotification {
  enabled: boolean;
  time: { hour: number; minute: number };
  triggerType: "daily" | "weekly" | "monthly";
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  notification: HabitNotification;
  createdAt: string;
  color: string;
}

export interface DailyLog {
  date: string; // ISO format: "2025-01-15"
  logs: Record<string, boolean>; // habitId -> completed
  completionRate: number;
  note?: string;
}

export interface WeeklyStats {
  weekKey: string; // e.g. "2025-W03"
  habitStats: Record<string, number>; // habitId -> completion count
  avgCompletionRate: number;
}

export interface MonthlyStats {
  monthKey: string; // e.g. "2025-01"
  habitStats: Record<string, number>;
  avgCompletionRate: number;
  bestDay?: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  theme: "light" | "dark" | "auto";
  onboardingCompleted: boolean;
}

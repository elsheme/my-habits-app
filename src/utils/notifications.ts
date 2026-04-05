import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Habit } from "../types";

// ─────────────────────────────────────────────
// Configure how notifications appear when app is foreground
// ─────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─────────────────────────────────────────────
// Request permissions — call at end of Onboarding
// ─────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─────────────────────────────────────────────
// Schedule daily notification for a single habit
// ─────────────────────────────────────────────
export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  if (!habit.notification.enabled || Platform.OS === 'web') return;

  // Cancel any existing notification for this habit first
  await cancelHabitNotification(habit.id);

  const identifier = `habit_${habit.id}`;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: `${habit.icon} ${habit.name}`,
      body: "حان وقت محاسبة نفسك 🌙",
      data: { habitId: habit.id },
    },
    trigger: {
      // استخدام النوع DAILY بشكل صريح يحل مشكلة أندرويد
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: habit.notification.time.hour,
      minute: habit.notification.time.minute,
    },
  });
}

// ─────────────────────────────────────────────
// Cancel notification for a single habit
// ─────────────────────────────────────────────
export async function cancelHabitNotification(habitId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`habit_${habitId}`);
  } catch (e) {
    console.log("No notification to cancel for this habit");
  }
}

// ─────────────────────────────────────────────
// Schedule all active habits notifications
// ─────────────────────────────────────────────
export async function scheduleAllHabitNotifications(habits: Habit[]): Promise<void> {
  if (Platform.OS === 'web') return;
  for (const habit of habits) {
    if (habit.isActive && habit.notification.enabled) {
      await scheduleHabitNotification(habit);
    }
  }
}

// ─────────────────────────────────────────────
// Cancel ALL scheduled notifications
// ─────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─────────────────────────────────────────────
// Schedule Friday Harvest notification — every Friday 8 PM
// ─────────────────────────────────────────────
export async function scheduleFridayHarvest(completed: number, total: number): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync("friday_harvest");

  await Notifications.scheduleNotificationAsync({
    identifier: "friday_harvest",
    content: {
      title: "📊 حصاد أسبوعك",
      body: `أتممت ${completed}/${total} عادة هذا الأسبوع`,
      data: { type: "friday_harvest" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, // الجمعة (1=الأحد، 6=الجمعة في إكسبو)
      hour: 20,
      minute: 0,
    },
  });
}

// ─────────────────────────────────────────────
// Schedule Monthly Summary notification
// ─────────────────────────────────────────────
export async function scheduleMonthlyNotification(dayOfMonth: number = 1): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync("monthly_summary");

  await Notifications.scheduleNotificationAsync({
    identifier: "monthly_summary",
    content: {
      title: "📅 ملخص شهرك",
      body: "افتح التطبيق لمراجعة إحصاءات شهرك الماضي 📈",
      data: { type: "monthly_summary" },
    },
    trigger: {
      // للملخص الشهري نستخدم CALENDAR مع تحديد اليوم والساعة
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: dayOfMonth,
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}
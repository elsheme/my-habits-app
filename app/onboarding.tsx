import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Switch,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { DEFAULT_HABITS, buildDefaultHabits } from "../src/constants/defaultHabits";
import { useHabitsStore } from "../src/store/habitsStore";
import { saveSettings } from "../src/utils/storage";
import { requestNotificationPermission, scheduleAllHabitNotifications, scheduleFridayHarvest } from "../src/utils/notifications";
import { Habit } from "../src/types";

type OnboardingStep = 1 | 2 | 3 | 4;

// ─────────────────────────────────────────────
// Step 1: Welcome
// ─────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.stepContainer}>
      <Text style={styles.welcomeEmoji}>🌙</Text>
      <Text style={styles.welcomeTitle}>محاسبة العادات اليومية</Text>
      <Text style={styles.welcomeSubtitle}>
        رافقك في تتبع عباداتك وعاداتك اليومية بكل سهولة ويسر
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>ابدأ الآن</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Step 2: Choose Habits
// ─────────────────────────────────────────────
interface StepChooseProps {
  selected: Set<number>;
  onToggle: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function StepChoose({ selected, onToggle, onNext, onBack }: StepChooseProps) {
  return (
    <Animated.View entering={SlideInRight.springify()} exiting={SlideOutLeft} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>اختر عاداتك</Text>
      <Text style={styles.stepSubtitle}>حدد العادات التي تريد متابعتها يومياً</Text>

      <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false}>
        {DEFAULT_HABITS.map((habit, index) => {
          const isSelected = selected.has(index);
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onToggle(index)}
              style={[styles.habitSelectRow, isSelected && styles.habitSelectRowActive]}
              activeOpacity={0.8}
            >
              <View style={[styles.selectCheckbox, isSelected && { backgroundColor: habit.color, borderColor: habit.color }]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.habitSelectIcon}>{habit.icon}</Text>
              <Text style={[styles.habitSelectName, isSelected && styles.habitSelectNameActive]}>
                {habit.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>رجوع</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.buttonFlex, selected.size === 0 && styles.buttonDisabled]}
          onPress={onNext}
          disabled={selected.size === 0}
        >
          <Text style={styles.primaryButtonText}>التالي ({selected.size})</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Step 3: Set Notifications
// ─────────────────────────────────────────────
interface NotificationTime {
  enabled: boolean;
  hour: number;
  minute: number;
}

interface StepNotifProps {
  selectedIndices: number[];
  notifTimes: NotificationTime[];
  onUpdate: (index: number, update: Partial<NotificationTime>) => void;
  onNext: () => void;
  onBack: () => void;
}

function StepNotifications({ selectedIndices, notifTimes, onUpdate, onNext, onBack }: StepNotifProps) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, "0");
    const m = minute.toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  return (
    <Animated.View entering={SlideInRight.springify()} exiting={SlideOutLeft} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>ضبط التنبيهات</Text>
      <Text style={styles.stepSubtitle}>يمكنك تغيير وقت تنبيه كل عادة أو إيقافه</Text>

      <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false}>
        {selectedIndices.map((habitIndex, i) => {
          const habit = DEFAULT_HABITS[habitIndex];
          const notif = notifTimes[i];
          return (
            <View key={i} style={styles.notifRow}>
              <View style={styles.notifLeft}>
                <Text style={styles.habitSelectIcon}>{habit.icon}</Text>
                <Text style={styles.notifHabitName}>{habit.name}</Text>
              </View>
              <View style={styles.notifRight}>
                {notif.enabled && (
                  <TouchableOpacity
                    onPress={() => setPickerIndex(pickerIndex === i ? null : i)}
                    style={styles.timeBadge}
                  >
                    <Text style={styles.timeBadgeText}>
                      {formatTime(notif.hour, notif.minute)}
                    </Text>
                  </TouchableOpacity>
                )}
                <Switch
                  value={notif.enabled}
                  onValueChange={(val) => onUpdate(i, { enabled: val })}
                  trackColor={{ true: "#148F77" }}
                  thumbColor="#FFFFFF"
                />
              </View>
              {pickerIndex === i && Platform.OS === "ios" && (
                <DateTimePicker
                  mode="time"
                  value={new Date(2000, 0, 1, notif.hour, notif.minute)}
                  onChange={(_, date) => {
                    if (date) {
                      onUpdate(i, { hour: date.getHours(), minute: date.getMinutes() });
                    }
                    setPickerIndex(null);
                  }}
                  is24Hour
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>رجوع</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, styles.buttonFlex]} onPress={onNext}>
          <Text style={styles.primaryButtonText}>ابدأ المحاسبة</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Onboarding
// ─────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const { initWithDefaultHabits } = useHabitsStore();

  const [step, setStep] = useState<OnboardingStep>(1);

  // Step 2: which habit indices are selected (all by default)
  const [selected, setSelected] = useState<Set<number>>(
    new Set(DEFAULT_HABITS.map((_, i) => i))
  );

  // Step 3: notification times per selected habit
  const selectedIndices = Array.from(selected).sort();
  const [notifTimes, setNotifTimes] = useState<{ enabled: boolean; hour: number; minute: number }[]>(
    DEFAULT_HABITS.map((h) => ({
      enabled: true,
      hour: h.notification.time.hour,
      minute: h.notification.time.minute,
    }))
  );

  const toggleHabit = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const updateNotif = (i: number, update: Partial<(typeof notifTimes)[0]>) => {
    setNotifTimes((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...update } : n)));
  };

  const finish = async () => {
    // Request notification permission (must be at end of onboarding per Apple guidelines)
    await requestNotificationPermission();

    // Build habits from selected indices
    const allDefaults = buildDefaultHabits();
    const chosenHabits: typeof allDefaults = [];

    selectedIndices.forEach((habitIndex, i) => {
      const habit = allDefaults[habitIndex];
      chosenHabits.push({
        ...habit,
        notification: {
          ...habit.notification,
          enabled: notifTimes[i].enabled,
          time: { hour: notifTimes[i].hour, minute: notifTimes[i].minute },
        },
      });
    });

    await initWithDefaultHabits(chosenHabits);
    await scheduleAllHabitNotifications(chosenHabits);
    await scheduleFridayHarvest(0, chosenHabits.length);
    await saveSettings({ onboardingCompleted: true });
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {([1, 2, 3] as const).map((s) => (
          <View
            key={s}
            style={[styles.dot, step >= s && styles.dotActive]}
          />
        ))}
      </View>

      {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
      {step === 2 && (
        <StepChoose
          selected={selected}
          onToggle={toggleHabit}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepNotifications
          selectedIndices={selectedIndices}
          notifTimes={selectedIndices.map((i) => notifTimes[i])}
          onUpdate={(i, update) => {
            const actualIndex = selectedIndices[i];
            updateNotif(actualIndex, update);
          }}
          onNext={finish}
          onBack={() => setStep(2)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F4EE",
    paddingTop: Platform.OS === "ios" ? 60 : 36,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D0D0D0",
  },
  dotActive: {
    backgroundColor: "#148F77",
    width: 24,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Welcome Step
  welcomeEmoji: {
    fontSize: 64,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 48,
  },

  // Shared
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "right",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "right",
    marginBottom: 20,
  },
  habitsList: {
    flex: 1,
    marginBottom: 16,
  },

  // Habit Select Row (Step 2)
  habitSelectRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  habitSelectRowActive: {
    borderColor: "#148F77",
    backgroundColor: "#F0FBF7",
  },
  selectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  habitSelectIcon: {
    fontSize: 22,
  },
  habitSelectName: {
    fontSize: 16,
    color: "#1A1A1A",
    flex: 1,
    textAlign: "right",
  },
  habitSelectNameActive: {
    color: "#148F77",
    fontWeight: "600",
  },

  // Notification Row (Step 3)
  notifRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "#ECECEC",
    flexWrap: "wrap",
  },
  notifLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  notifHabitName: {
    fontSize: 15,
    color: "#1A1A1A",
    textAlign: "right",
  },
  notifRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  timeBadge: {
    backgroundColor: "#E8F8F4",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  timeBadgeText: {
    fontSize: 14,
    color: "#148F77",
    fontWeight: "600",
  },

  // Buttons
  buttonRow: {
    flexDirection: "row-reverse",
    gap: 12,
    paddingBottom: 32,
  },
  buttonFlex: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#148F77",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#ECECEC",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#B0B0B0",
  },
});

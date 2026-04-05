import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  I18nManager,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import "expo-crypto";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useRouter } from "expo-router";
import { useHabitsStore } from "../../src/store/habitsStore";
import { Habit } from "../../src/types";

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// ─────────────────────────────────────────────
// Hijri date helper (basic calculation)
// ─────────────────────────────────────────────
function getHijriDate(): string {
  // Use Intl.DateTimeFormat with Islamic calendar
  try {
    const formatter = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formatter.format(new Date());
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────
// Habit Checkbox Row
// ─────────────────────────────────────────────
interface HabitRowProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
  index: number;
}

function HabitRow({ habit, completed, onToggle, index }: HabitRowProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );
    onToggle();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={animStyle}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.habitRow, completed && styles.habitRowCompleted]}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, completed && { backgroundColor: habit.color, borderColor: habit.color }]}>
          {completed && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Icon + Name */}
        <View style={styles.habitInfo}>
          <Text style={styles.habitIcon}>{habit.icon}</Text>
          <Text style={[styles.habitName, completed && styles.habitNameDone]}>
            {habit.name}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Completion Celebration
// ─────────────────────────────────────────────
function CompletionBanner() {
  return (
    <Animated.View entering={FadeIn.springify()} style={styles.completionBanner}>
      <Text style={styles.completionEmoji}>🎉</Text>
      <Text style={styles.completionText}>أحسنت! أكملت جميع عاداتك اليوم</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function DayScreen() {
  const router = useRouter();
  const { habits, todayLog, loadHabits, loadTodayLog, toggleHabit } = useHabitsStore();

  useEffect(() => {
    loadHabits().then(() => loadTodayLog());
  }, []);

  const activeHabits = habits.filter((h) => h.isActive);
  const completedCount = todayLog
    ? Object.values(todayLog.logs).filter(Boolean).length
    : 0;
  const totalCount = activeHabits.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const progressPercent = totalCount > 0 ? completedCount / totalCount : 0;

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withSpring(progressPercent, { damping: 15 });
  }, [progressPercent]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const hijriDate = getHijriDate();
  const gregorianDate = format(new Date(), "EEEE، d MMMM yyyy", { locale: ar });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.hijriDate}>{hijriDate}</Text>
        <Text style={styles.gregorianDate}>{gregorianDate}</Text>
      </Animated.View>

      {/* Progress */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>تقدم اليوم</Text>
          <Text style={styles.progressCount}>
            {completedCount} من {totalCount}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, progressStyle]} />
        </View>
      </Animated.View>

      {/* Celebration Banner */}
      {isAllDone && <CompletionBanner />}

      {/* Habits List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {activeHabits.map((habit, index) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            completed={todayLog?.logs[habit.id] ?? false}
            onToggle={() => toggleHabit(habit.id)}
            index={index}
          />
        ))}
      </ScrollView>

      {/* Add Habit FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/settings")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F4EE",
    paddingTop: Platform.OS === "ios" ? 56 : 32,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: "flex-end",
  },
  hijriDate: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "right",
    writingDirection: "rtl",
  },
  gregorianDate: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
    textAlign: "right",
  },
  progressSection: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  progressCount: {
    fontSize: 14,
    color: "#148F77",
    fontWeight: "700",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    backgroundColor: "#148F77",
    borderRadius: 4,
  },
  completionBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#E8F8F4",
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  completionEmoji: {
    fontSize: 22,
  },
  completionText: {
    fontSize: 15,
    color: "#148F77",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 10,
  },
  habitRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  habitRowCompleted: {
    backgroundColor: "#F0FBF7",
    borderColor: "#B2E4D8",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  habitInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  habitIcon: {
    fontSize: 22,
  },
  habitName: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
    textAlign: "right",
  },
  habitNameDone: {
    color: "#888",
    textDecorationLine: "line-through",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    left: 24, // Left for RTL = visual right
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#148F77",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#148F77",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 30,
    color: "#FFFFFF",
    lineHeight: 32,
  },
});

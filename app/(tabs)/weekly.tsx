import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Share, I18nManager,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useHabitsStore } from '../../src/store/habitsStore';
import { useWeeklyStats } from '../../src/hooks/useStats';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const DAYS_AR = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج']; // Sat→Fri

// ─────────────────────────────────────────────
// Bar component
// ─────────────────────────────────────────────
function Bar({ rate, color }: { rate: number; color: string }) {
  return (
    <View style={styles.barWrapper}>
      <View style={[styles.barBg]}>
        <View style={[styles.barFill, { height: `${Math.round(rate * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barLabel}>{Math.round(rate * 100)}%</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Week grid row
// ─────────────────────────────────────────────
function WeekRow({
  habit,
  weekDates,
  logs,
  index,
}: {
  habit: { id: string; icon: string; name: string; color: string };
  weekDates: string[];
  logs: Map<string, Record<string, boolean>>;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.gridRow}>
      {/* Habit name */}
      <View style={styles.gridHabitCell}>
        <Text style={styles.gridIcon}>{habit.icon}</Text>
        <Text style={styles.gridHabitName} numberOfLines={1}>{habit.name}</Text>
      </View>
      {/* Day cells */}
      {weekDates.map((date) => {
        const dayLog = logs.get(date);
        const done = dayLog?.[habit.id] ?? null;
        return (
          <View
            key={date}
            style={[
              styles.gridCell,
              done === true && { backgroundColor: habit.color },
              done === false && styles.gridCellMiss,
            ]}
          >
            {done === true && <Text style={styles.gridCheck}>✓</Text>}
            {done === false && <Text style={styles.gridMiss}>✗</Text>}
          </View>
        );
      })}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function WeeklyScreen() {
  const { habits } = useHabitsStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = weekOffset === 0
    ? new Date()
    : weekOffset > 0
      ? addWeeks(new Date(), weekOffset)
      : subWeeks(new Date(), -weekOffset);

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 6 });
  const { weekLogs, habitStats, bestDay, harvestMessage, streaks, loading } = useWeeklyStats(weekStart);

  // Build date strings for the 7 days
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });

  const logsMap = new Map(weekLogs.map((l) => [l.date, l.logs]));

  const weekLabel = `${format(weekStart, 'd MMM', { locale: ar })} — ${format(
    new Date(weekStart.getTime() + 6 * 86400000), 'd MMM yyyy', { locale: ar }
  )}`;

  const shareHarvest = async () => {
    await Share.share({ message: harvestMessage });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setWeekOffset((p) => p - 1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity
          onPress={() => setWeekOffset((p) => p + 1)}
          style={[styles.navBtn, weekOffset >= 0 && styles.navBtnDisabled]}
          disabled={weekOffset >= 0}
        >
          <Text style={[styles.navArrow, weekOffset >= 0 && { color: '#CCC' }]}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Day headers */}
        <View style={styles.gridRow}>
          <View style={styles.gridHabitCell} />
          {DAYS_AR.map((d, i) => (
            <View key={i} style={styles.gridCell}>
              <Text style={styles.dayHeader}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Habit rows */}
        {habits.filter((h) => h.isActive).map((habit, i) => (
          <WeekRow
            key={habit.id}
            habit={habit}
            weekDates={weekDates}
            logs={logsMap}
            index={i}
          />
        ))}

        {/* Bar Chart */}
        <Text style={styles.sectionTitle}>نسبة الإتمام الأسبوعية</Text>
        <View style={styles.barChart}>
          {habits.filter((h) => h.isActive).map((habit) => {
            const stat = habitStats.find((s) => s.habitId === habit.id);
            return (
              <View key={habit.id} style={styles.barColumn}>
                <Bar rate={stat?.rate ?? 0} color={habit.color} />
                <Text style={styles.barHabitIcon}>{habit.icon}</Text>
              </View>
            );
          })}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          {bestDay && (
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statLabel}>أفضل يوم</Text>
              <Text style={styles.statValue}>{bestDay}</Text>
            </View>
          )}
          {streaks.map((s) => {
            const habit = habits.find((h) => h.id === s.habitId);
            if (!habit || s.streak === 0) return null;
            return (
              <View key={s.habitId} style={styles.statCard}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{habit.name}</Text>
                <Text style={styles.statValue}>{s.streak} يوم</Text>
              </View>
            );
          })}
        </View>

        {/* Friday Harvest */}
        <View style={styles.harvestBox}>
          <View style={styles.harvestHeader}>
            <Text style={styles.harvestTitle}>📤 حصاد الجمعة</Text>
            <TouchableOpacity onPress={shareHarvest} style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>مشاركة</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.harvestText}>{harvestMessage}</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EE', paddingTop: Platform.OS === 'ios' ? 56 : 32 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  weekLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  navBtn: { padding: 8 },
  navBtnDisabled: { opacity: 0.3 },
  navArrow: { fontSize: 26, color: '#148F77', fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },

  // Grid
  gridRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  gridHabitCell: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingRight: 4,
  },
  gridIcon: { fontSize: 16 },
  gridHabitName: { fontSize: 12, color: '#333', flex: 1, textAlign: 'right' },
  gridCell: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#ECECEC',
    alignItems: 'center', justifyContent: 'center', marginLeft: 3,
  },
  gridCellMiss: { backgroundColor: '#FDE8E8' },
  gridCheck: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  gridMiss: { fontSize: 12, color: '#E74C3C' },
  dayHeader: { fontSize: 11, color: '#888', fontWeight: '600' },

  // Bar chart
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'right', marginTop: 20, marginBottom: 12,
  },
  barChart: { flexDirection: 'row-reverse', justifyContent: 'space-around', height: 120 },
  barColumn: { alignItems: 'center', gap: 4, flex: 1 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  barBg: {
    width: 20, flex: 1, backgroundColor: '#E0E0E0', borderRadius: 4,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, color: '#888' },
  barHabitIcon: { fontSize: 16 },

  // Stat cards
  statsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  statCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    alignItems: 'center', minWidth: 90, flex: 1,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },

  // Harvest
  harvestBox: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginTop: 20, borderWidth: 1, borderColor: '#ECECEC',
  },
  harvestHeader: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  harvestTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  shareBtn: {
    backgroundColor: '#148F77', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  shareBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  harvestText: { fontSize: 14, color: '#444', lineHeight: 24, textAlign: 'right' },
});

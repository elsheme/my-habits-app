import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, I18nManager,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { format, addMonths, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useHabitsStore } from '../../src/store/habitsStore';
import { useMonthlyStats } from '../../src/hooks/useStats';
import { HeatmapCell } from '../../src/utils/stats';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// ─────────────────────────────────────────────
// Heatmap color scale
// ─────────────────────────────────────────────
const HEAT_COLORS: Record<HeatmapCell['level'], string> = {
  0: '#ECECEC', // no data
  1: '#FFCBA4', // weak  1-49%
  2: '#FFD700', // mid   50-74%
  3: '#7BC67E', // good  75-99%
  4: '#1E8449', // perfect 100%
};

function HeatCell({ cell }: { cell: HeatmapCell }) {
  const day = parseInt(cell.date.split('-')[2], 10);
  return (
    <View style={[styles.heatCell, { backgroundColor: HEAT_COLORS[cell.level] }]}>
      <Text style={[styles.heatDay, { color: cell.level >= 3 ? '#FFF' : '#555' }]}>
        {day}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Heatmap grid — fills empty leading cells
// ─────────────────────────────────────────────
function HeatmapGrid({ cells, year, month }: { cells: HeatmapCell[]; year: number; month: number }) {
  // day of week of first day (0=Sun, 6=Sat); we start week on Sat=6
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0-6
  const offset = (firstDay + 1) % 7; // shift so Sat=0

  const DAY_HEADERS = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];

  return (
    <View>
      {/* Day headers */}
      <View style={styles.heatRow}>
        {DAY_HEADERS.map((d) => (
          <View key={d} style={styles.heatCell}>
            <Text style={styles.heatHeader}>{d}</Text>
          </View>
        ))}
      </View>
      {/* Grid rows */}
      {Array.from({ length: Math.ceil((cells.length + offset) / 7) }, (_, week) => (
        <View key={week} style={styles.heatRow}>
          {Array.from({ length: 7 }, (_, dow) => {
            const cellIndex = week * 7 + dow - offset;
            if (cellIndex < 0 || cellIndex >= cells.length) {
              return <View key={dow} style={styles.heatCell} />;
            }
            return <HeatCell key={dow} cell={cells[cellIndex]} />;
          })}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────
function HeatLegend() {
  const items: { label: string; level: HeatmapCell['level'] }[] = [
    { label: '0%', level: 0 },
    { label: '1-49%', level: 1 },
    { label: '50-74%', level: 2 },
    { label: '75-99%', level: 3 },
    { label: '100%', level: 4 },
  ];
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.level} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: HEAT_COLORS[item.level] }]} />
          <Text style={styles.legendLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function MonthlyScreen() {
  const { habits } = useHabitsStore();
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const target = monthOffset === 0 ? now : monthOffset > 0 ? addMonths(now, monthOffset) : subMonths(now, -monthOffset);
  const year = target.getFullYear();
  const month = target.getMonth() + 1;

  const { heatmap, totalRate, bestHabit, worstHabit, longestStreaks, loading } =
    useMonthlyStats(year, month);

  const monthLabel = format(target, 'MMMM yyyy', { locale: ar });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMonthOffset((p) => p - 1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={() => setMonthOffset((p) => p + 1)}
          style={[styles.navBtn, monthOffset >= 0 && styles.navBtnDisabled]}
          disabled={monthOffset >= 0}
        >
          <Text style={[styles.navArrow, monthOffset >= 0 && { color: '#CCC' }]}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Heatmap */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
          <Text style={styles.sectionTitle}>🗓️ هيت ماب الشهر</Text>
          {heatmap.length > 0 ? (
            <HeatmapGrid cells={heatmap} year={year} month={month} />
          ) : (
            <Text style={styles.emptyText}>لا توجد بيانات لهذا الشهر</Text>
          )}
          <HeatLegend />
        </Animated.View>

        {/* Stats cards */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.statCard, styles.statCardWide]}>
            <Text style={styles.statEmoji}>📉</Text>
            <Text style={styles.statLabel}>إجمالي الإتمام</Text>
            <Text style={styles.statBigValue}>{Math.round(totalRate * 100)}%</Text>
          </Animated.View>

          {bestHabit && (
            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statCard}>
              <Text style={styles.statEmoji}>🥇</Text>
              <Text style={styles.statLabel}>أفضل عادة</Text>
              <Text style={styles.statValue} numberOfLines={2}>{bestHabit}</Text>
            </Animated.View>
          )}

          {worstHabit && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statCard}>
              <Text style={styles.statEmoji}>⚠️</Text>
              <Text style={styles.statLabel}>تحتاج تحسين</Text>
              <Text style={styles.statValue} numberOfLines={2}>{worstHabit}</Text>
            </Animated.View>
          )}
        </View>

        {/* Longest streaks */}
        {longestStreaks.filter((s) => s.streak > 0).length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.card}>
            <Text style={styles.sectionTitle}>🔥 أطول سلسلة في الشهر</Text>
            {longestStreaks
              .filter((s) => s.streak > 0)
              .sort((a, b) => b.streak - a.streak)
              .map((s, i) => {
                const habit = habits.find((h) => h.id === s.habitId);
                if (!habit) return null;
                return (
                  <View key={s.habitId} style={styles.streakRow}>
                    <View style={styles.streakLeft}>
                      <Text style={styles.streakRank}>#{i + 1}</Text>
                      <Text style={styles.streakIcon}>{habit.icon}</Text>
                      <Text style={styles.streakName}>{habit.name}</Text>
                    </View>
                    <View style={[styles.streakBadge, { backgroundColor: habit.color }]}>
                      <Text style={styles.streakBadgeText}>{s.streak} يوم</Text>
                    </View>
                  </View>
                );
              })}
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EE', paddingTop: Platform.OS === 'ios' ? 56 : 32 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12,
  },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  navBtn: { padding: 8 },
  navBtnDisabled: { opacity: 0.3 },
  navArrow: { fontSize: 26, color: '#148F77', fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#ECECEC',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', textAlign: 'right', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#AAA', textAlign: 'center', paddingVertical: 20 },

  // Heatmap
  heatRow: { flexDirection: 'row-reverse', marginBottom: 3 },
  heatCell: {
    width: 36, height: 36, borderRadius: 6, margin: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  heatDay: { fontSize: 11, fontWeight: '500' },
  heatHeader: { fontSize: 11, color: '#888', fontWeight: '600' },

  // Legend
  legend: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendLabel: { fontSize: 11, color: '#666' },

  // Stats grid
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    alignItems: 'center', flex: 1, minWidth: 130,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  statCardWide: { minWidth: '100%' },
  statEmoji: { fontSize: 26, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  statBigValue: { fontSize: 32, fontWeight: '700', color: '#148F77' },

  // Streaks
  streakRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: '#ECECEC',
  },
  streakLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 },
  streakRank: { fontSize: 12, color: '#AAA', width: 20, textAlign: 'center' },
  streakIcon: { fontSize: 20 },
  streakName: { fontSize: 14, color: '#1A1A1A', flex: 1, textAlign: 'right' },
  streakBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  streakBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

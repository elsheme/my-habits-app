import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
  Alert,
  I18nManager,
  TextInput,
  Modal,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useHabitsStore } from "../../src/store/habitsStore";
import { saveSettings } from "../../src/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { exportCSV } from "../../src/utils/exportCSV";
import {
  cancelAllNotifications,
  scheduleMonthlyNotification,
} from "../../src/utils/notifications";
import { Habit } from "../../src/types";
// 1. استبدال uuid بمكتبة expo-crypto
import * as Crypto from "expo-crypto"; 

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// ─────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

// ─────────────────────────────────────────────
// Setting Row
// ─────────────────────────────────────────────
function SettingRow({
  label,
  value,
  onPress,
  danger = false,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.settingRow}
    >
      <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
      <View style={styles.settingRight}>
        {value !== undefined && <Text style={styles.settingValue}>{value}</Text>}
        {onPress && <Text style={styles.chevron}>‹</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// Preset Options
// ─────────────────────────────────────────────
const PRESET_ICONS = [
  "🌅", "🌇", "🕌", "📿", "☀️", "🌙",
  "📖", "📚", "🏃", "💧", "🍎", "🧘",
  "✍️", "🤲", "💪", "🎯",
];
const PRESET_COLORS = [
  "#148F77", "#E67E22", "#8E44AD", "#2980B9", "#C0392B",
  "#27AE60", "#F39C12", "#1ABC9C", "#E91E63", "#FF5722",
];

// ─────────────────────────────────────────────
// Add/Edit Habit Modal
// ─────────────────────────────────────────────
interface HabitModalProps {
  visible: boolean;
  existing?: Habit | null;
  onSave: (habit: Habit) => void;
  onClose: () => void;
}

function HabitModal({ visible, existing, onSave, onClose }: HabitModalProps) {
  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState(existing?.icon ?? "🌙");
  const [color, setColor] = useState(existing?.color ?? "#148F77");
  const [notifEnabled, setNotifEnabled] = useState(existing?.notification.enabled ?? true);
  const [hour, setHour] = useState(existing?.notification.time.hour ?? 8);
  const [minute, setMinute] = useState(existing?.notification.time.minute ?? 0);
  const [showPicker, setShowPicker] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(existing?.name ?? "");
      setIcon(existing?.icon ?? "🌙");
      setColor(existing?.color ?? "#148F77");
      setNotifEnabled(existing?.notification.enabled ?? true);
      setHour(existing?.notification.time.hour ?? 8);
      setMinute(existing?.notification.time.minute ?? 0);
    }
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("تنبيه", "أدخل اسم العادة");
      return;
    }
    const habit: Habit = {
      // 2. استخدام Crypto.randomUUID() بدلاً من uuidv4()
      id: existing?.id ?? Crypto.randomUUID(),
      name: name.trim(),
      icon,
      color,
      isDefault: existing?.isDefault ?? false,
      isActive: true,
      createdAt: existing?.createdAt ?? new Date().toISOString().split("T")[0],
      notification: {
        enabled: notifEnabled,
        time: { hour, minute },
        triggerType: "daily",
      },
    };
    onSave(habit);
    onClose();
  };

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancelText}>إلغاء</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{existing ? "تعديل العادة" : "عادة جديدة"}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
            <Text style={styles.modalSaveText}>حفظ</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={[styles.habitPreview, { backgroundColor: color + "22" }]}>
            <Text style={styles.previewIcon}>{icon}</Text>
            <Text style={[styles.previewName, { color }]}>{name || "اسم العادة"}</Text>
          </View>

          <Text style={styles.inputLabel}>اسم العادة</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="مثال: أذكار الصباح"
            textAlign="right"
            maxLength={30}
          />

          <Text style={styles.inputLabel}>الأيقونة</Text>
          <View style={styles.iconGrid}>
            {PRESET_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                onPress={() => setIcon(ic)}
                style={[styles.iconOption, icon === ic && styles.iconOptionSelected]}
              >
                <Text style={styles.iconOptionText}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>اللون</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorOptionSelected,
                ]}
              />
            ))}
          </View>

          <View style={styles.notifSection}>
            <View style={styles.notifToggleRow}>
              <Text style={styles.inputLabel}>تنبيه يومي</Text>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ true: "#148F77" }}
                thumbColor="#FFF"
              />
            </View>
            {notifEnabled && (
              <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timePicker}>
                <Text style={styles.timePickerText}>{pad(hour)}:{pad(minute)}</Text>
              </TouchableOpacity>
            )}
            {showPicker && (
              <DateTimePicker
                mode="time"
                value={new Date(2000, 0, 1, hour, minute)}
                onChange={(_, d) => {
                  setShowPicker(Platform.OS === "ios"); // في أندرويد يغلق تلقائياً، في آيفون يظل مفتوحاً
                  if (d) { setHour(d.getHours()); setMinute(d.getMinutes()); }
                }}
                is24Hour
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Main Settings Screen
// ─────────────────────────────────────────────
export default function SettingsScreen() {
  const { habits, addHabit, updateHabit, deleteHabit } = useHabitsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [monthlyDay, setMonthlyDay] = useState(1);

  const activeHabits = habits.filter((h) => h.isActive);

  const openAdd = () => { setEditingHabit(null); setModalVisible(true); };
  const openEdit = (h: Habit) => { setEditingHabit(h); setModalVisible(true); };

  const handleSaveHabit = async (habit: Habit) => {
    if (editingHabit) await updateHabit(habit);
    else await addHabit(habit);
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert("حذف العادة", `هل تريد حذف "${habit.name}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteHabit(habit.id) },
    ]);
  };

  const handleExportCSV = async () => {
    try {
      await exportCSV(habits);
    } catch (e: any) {
      Alert.alert("خطأ في التصدير", e.message);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert("⚠️ حذف جميع البيانات", "سيتم مسح كل بياناتك نهائياً.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تأكيد الحذف",
        style: "destructive",
        onPress: () => {
          Alert.alert("تأكيد نهائي", "هل أنت متأكد تماماً؟", [
            { text: "لا", style: "cancel" },
            {
              text: "نعم، احذف كل شيء",
              style: "destructive",
              onPress: async () => {
                await cancelAllNotifications();
                await AsyncStorage.clear();
                Alert.alert("تم", "تم حذف جميع البيانات. أعد تشغيل التطبيق.");
              },
            },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>⚙️ الإعدادات</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Habits Management ── */}
        <SectionHeader title="📝 إدارة العادات" />
        <Animated.View entering={FadeInDown.springify()} style={styles.card}>
          {activeHabits.map((habit, i) => (
            <View key={habit.id} style={[styles.habitRow, i > 0 && styles.habitRowBorder]}>
              <View style={styles.habitLeft}>
                <Text style={styles.habitIcon}>{habit.icon}</Text>
                <Text style={styles.habitName}>{habit.name}</Text>
              </View>
              <View style={styles.habitActions}>
                <TouchableOpacity onPress={() => openEdit(habit)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>تعديل</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteHabit(habit)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={openAdd} style={styles.addHabitBtn}>
            <Text style={styles.addHabitBtnText}>+ إضافة عادة جديدة</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Notifications per habit ── */}
        <SectionHeader title="🔔 التنبيهات" />
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.card}>
          {activeHabits.map((habit, i) => (
            <View key={habit.id} style={[styles.notifRow, i > 0 && styles.habitRowBorder]}>
              <View style={styles.habitLeft}>
                <Text style={styles.habitIcon}>{habit.icon}</Text>
                <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
              </View>
              <View style={styles.notifRight}>
                <Text style={styles.timeText}>
                  {habit.notification.time.hour.toString().padStart(2, "0")}:
                  {habit.notification.time.minute.toString().padStart(2, "0")}
                </Text>
                <Switch
                  value={habit.notification.enabled}
                  onValueChange={async (val) => {
                    await updateHabit({
                      ...habit,
                      notification: { ...habit.notification, enabled: val },
                    });
                  }}
                  trackColor={{ true: "#148F77" }}
                  thumbColor="#FFF"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── Monthly Report Day ── */}
        <SectionHeader title="📅 التلخيص الشهري" />
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.card}>
          <Text style={styles.monthlyLabel}>يوم الشهر للتقرير الشهري</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <TouchableOpacity
                key={day}
                onPress={async () => {
                  setMonthlyDay(day);
                  await scheduleMonthlyNotification(day);
                }}
                style={[styles.dayChip, monthlyDay === day && styles.dayChipActive]}
              >
                <Text style={[styles.dayChipText, monthlyDay === day && styles.dayChipTextActive]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Data ── */}
        <SectionHeader title="💾 البيانات" />
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.card}>
          <SettingRow label="📤 تصدير البيانات (CSV)" value="آخر 60 يوم" onPress={handleExportCSV} />
          <View style={styles.sep} />
          <SettingRow label="🗑️ حذف جميع البيانات" danger onPress={handleDeleteAllData} />
        </Animated.View>

        {/* ── About ── */}
        <SectionHeader title="ℹ️ عن التطبيق" />
        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.card, styles.aboutCard]}>
          <Text style={styles.aboutEmoji}>🌙</Text>
          <Text style={styles.aboutTitle}>محاسبة العادات اليومية</Text>
          <Text style={styles.aboutVersion}>الإصدار 1.0.0</Text>
          <Text style={styles.aboutNote}>
            بياناتك تُحفظ على جهازك فقط — لا يُرسل أي شيء للخارج أبداً ✅
          </Text>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <HabitModal
        visible={modalVisible}
        existing={editingHabit}
        onSave={handleSaveHabit}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F4EE", paddingTop: Platform.OS === "ios" ? 56 : 32 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A", textAlign: "right", paddingHorizontal: 20, marginBottom: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: { fontSize: 12, fontWeight: "700", color: "#AAA", textAlign: "right", marginTop: 20, marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#ECECEC", overflow: "hidden" },

  habitRow: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  habitRowBorder: { borderTopWidth: 0.5, borderTopColor: "#ECECEC" },
  habitLeft: { flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 },
  habitIcon: { fontSize: 20 },
  habitName: { fontSize: 15, color: "#1A1A1A", flex: 1, textAlign: "right" },
  habitActions: { flexDirection: "row-reverse", gap: 8 },
  editBtn: { backgroundColor: "#E8F8F4", borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  editBtnText: { fontSize: 13, color: "#148F77", fontWeight: "600" },
  deleteBtn: { backgroundColor: "#FEE8E8", borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  deleteBtnText: { fontSize: 13, color: "#E74C3C", fontWeight: "600" },
  addHabitBtn: { paddingVertical: 14, alignItems: "center", borderTopWidth: 0.5, borderTopColor: "#ECECEC" },
  addHabitBtnText: { fontSize: 15, color: "#148F77", fontWeight: "700" },

  notifRow: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  notifRight: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  timeText: { fontSize: 14, color: "#148F77", fontWeight: "600" },

  monthlyLabel: { fontSize: 14, color: "#555", textAlign: "right", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  dayScroll: { paddingHorizontal: 12, paddingBottom: 14 },
  dayChip: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ECECEC", alignItems: "center", justifyContent: "center", marginRight: 6 },
  dayChipActive: { backgroundColor: "#148F77" },
  dayChipText: { fontSize: 13, color: "#555", fontWeight: "600" },
  dayChipTextActive: { color: "#FFF" },

  settingRow: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  settingLabel: { fontSize: 15, color: "#1A1A1A", flex: 1, textAlign: "right" },
  dangerText: { color: "#E74C3C" },
  settingRight: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  settingValue: { fontSize: 14, color: "#888" },
  chevron: { fontSize: 20, color: "#CCC" },
  sep: { height: 0.5, backgroundColor: "#ECECEC", marginHorizontal: 16 },

  aboutCard: { alignItems: "center", paddingVertical: 24, gap: 6 },
  aboutEmoji: { fontSize: 40 },
  aboutTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  aboutVersion: { fontSize: 13, color: "#AAA" },
  aboutNote: { fontSize: 13, color: "#666", textAlign: "center", paddingHorizontal: 24, marginTop: 8, lineHeight: 22 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#F7F4EE" },
  modalHeader: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 56 : 20, paddingBottom: 16,
    backgroundColor: "#FFF", borderBottomWidth: 0.5, borderBottomColor: "#ECECEC",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  modalCancelText: { fontSize: 16, color: "#888" },
  modalSaveBtn: { backgroundColor: "#148F77", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 16 },
  modalSaveText: { fontSize: 15, color: "#FFF", fontWeight: "700" },
  modalContent: { padding: 20 },
  habitPreview: { flexDirection: "row-reverse", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, marginBottom: 16 },
  previewIcon: { fontSize: 28 },
  previewName: { fontSize: 18, fontWeight: "700" },
  inputLabel: { fontSize: 13, color: "#888", textAlign: "right", marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#ECECEC", padding: 14, fontSize: 16, color: "#1A1A1A" },
  iconGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  iconOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#ECECEC", alignItems: "center", justifyContent: "center" },
  iconOptionSelected: { borderWidth: 2, borderColor: "#148F77", backgroundColor: "#E8F8F4" },
  iconOptionText: { fontSize: 22 },
  colorGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  colorOptionSelected: { borderWidth: 3, borderColor: "#1A1A1A" },
  notifSection: { marginTop: 8 },
  notifToggleRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  timePicker: { backgroundColor: "#E8F8F4", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignSelf: "flex-end", marginTop: 8 },
  timePickerText: { fontSize: 18, color: "#148F77", fontWeight: "700" },
});
# 🌙 محاسبة العادات اليومية

تطبيق React Native / Expo لتتبع العادات اليومية — يعمل بالكامل بدون إنترنت، والبيانات تُحفظ على الجهاز فقط.

---

## 📁 هيكل المشروع

```
my-habits-app/
├── app/
│   ├── _layout.tsx          ← Root layout (RTL + onboarding check + data cleanup)
│   ├── onboarding.tsx       ← شاشة الإعداد الأولي (3 خطوات)
│   └── (tabs)/
│       ├── _layout.tsx      ← Tab bar setup
│       ├── index.tsx        ← شاشة اليوم ✅
│       ├── weekly.tsx       ← شاشة الأسبوع 📊
│       ├── monthly.tsx      ← شاشة الشهر 📈
│       └── settings.tsx     ← الإعدادات ⚙️
├── src/
│   ├── types/index.ts       ← TypeScript types
│   ├── store/habitsStore.ts ← Zustand store
│   ├── constants/
│   │   └── defaultHabits.ts ← 8 عادات افتراضية
│   ├── utils/
│   │   ├── storage.ts       ← AsyncStorage helpers
│   │   ├── stats.ts         ← Streak / heatmap / weekly stats
│   │   ├── notifications.ts ← Expo Notifications (sprint 4)
│   │   ├── exportCSV.ts     ← CSV export (sprint 4)
│   │   └── dataCleanup.ts   ← Auto-delete logs > 60 days
│   └── hooks/
│       └── useStats.ts      ← useWeeklyStats / useMonthlyStats
├── app.json                 ← Expo config + permissions
├── babel.config.js          ← Reanimated plugin (required)
├── tsconfig.json
└── package.json
```

---

## 🚀 تشغيل المشروع

### 1. تثبيت الحزم
```bash
npm install
```

### 2. تشغيل التطبيق
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# QR Code (Expo Go)
npx expo start
```

---

## 📦 المتطلبات

| الحزمة | الإصدار | الاستخدام |
|--------|---------|-----------|
| expo | ~52.0.0 | أساس المشروع |
| expo-router | ~4.0.0 | Navigation |
| expo-notifications | ~0.29.0 | التنبيهات |
| expo-task-manager | ~12.0.0 | Background tasks |
| @react-native-async-storage/async-storage | ^2.1.0 | التخزين المحلي |
| react-native-reanimated | ~3.16.0 | الأنيميشن |
| zustand | ^5.0.0 | State management |
| date-fns | ^3.6.0 | التواريخ |
| uuid | ^10.0.0 | معرفات فريدة |
| @react-native-community/datetimepicker | ^8.2.0 | اختيار الوقت |

---

## ✅ ما تم تنفيذه (الدورات 1–5)

### الدورة 1 (MVP الأساس)
- [x] شاشة اليوم مع تأشير العادات
- [x] AsyncStorage للحفظ المحلي
- [x] تصميم RTL كامل

### الدورة 2 (الإحصاءات)
- [x] شاشة الأسبوع (grid + bar chart)
- [x] شاشة الشهر (heatmap + streaks)
- [x] Onboarding (3 خطوات)

### الدورة 3 (الإحصاءات المتقدمة)
- [x] Streak calculation
- [x] Longest streak
- [x] Best day / أفضل وأسوأ عادة
- [x] حصاد الجمعة (نص قابل للمشاركة)
- [x] حذف تلقائي للبيانات القديمة (> 60 يوم)

### الدورة 4 (التنبيهات والإعدادات)
- [x] نظام التنبيهات الكامل (يومي / جمعة / شهري)
- [x] طلب الإذن عند نهاية Onboarding
- [x] شاشة الإعدادات الكاملة:
  - [x] إضافة / تعديل / حذف العادات
  - [x] تفعيل/تعطيل تنبيه كل عادة
  - [x] اختيار يوم التلخيص الشهري
  - [x] تصدير CSV (آخر 60 يوم)
  - [x] حذف جميع البيانات (تأكيد مزدوج)

### الدورة 5 (التحضير للإطلاق)
- [x] `app.json` مع كل الـ permissions
- [x] `babel.config.js` مع Reanimated plugin
- [x] دعم iOS و Android permissions
- [x] هيكل جاهز لـ EAS Build

---

## 🏗️ بناء للنشر (EAS Build)

```bash
# تثبيت EAS CLI
npm install -g eas-cli

# تسجيل الدخول
eas login

# إعداد المشروع
eas build:configure

# بناء iOS
eas build --platform ios

# بناء Android
eas build --platform android
```

---

## ⚠️ ملاحظات مهمة

1. **babel.config.js**: `react-native-reanimated/plugin` يجب أن يكون **آخر** plugin في القائمة
2. **التنبيهات على iOS**: طلب الإذن يتم في نهاية Onboarding وليس عند الفتح
3. **التقويم الهجري**: يستخدم `Intl.DateTimeFormat` مع `ca-islamic`
4. **AsyncStorage**: حجم التخزين محدود — البيانات تُحذف تلقائياً بعد 60 يوم
5. **RTL**: مفعّل بشكل كامل عبر `I18nManager.forceRTL(true)`

---

## 🔒 الخصوصية

- لا يُرسل أي بيانات خارج الجهاز
- المستخدم يملك بياناته ويمكنه تصديرها أو حذفها في أي وقت
- لا يوجد تتبع أو analytics

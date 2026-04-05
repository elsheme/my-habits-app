import { Tabs } from "expo-router";
import { Text } from "react-native";
import "expo-crypto";

function TabIcon({ emoji, label }: { emoji: string; label: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#ECECEC",
          borderTopWidth: 0.5,
          height: 70,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: "#148F77",
        tabBarInactiveTintColor: "#AAAAAA",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "اليوم",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? "📅" : "🗓️"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: "الأسبوع",
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="monthly"
        options={{
          title: "الشهر",
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📈</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "الإعدادات",
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}

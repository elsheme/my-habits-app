import "expo-crypto";
import { useEffect, useState } from "react";

import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { I18nManager } from "react-native";
import { getSettings } from "../src/utils/storage";
import { cleanOldData } from "../src/utils/dataCleanup";


// Force RTL globally
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      // 1. Clean old data (>60 days)
      await cleanOldData();

      // 2. Check onboarding status
      const settings = await getSettings();
      if (!settings.onboardingCompleted) {
        router.replace("/onboarding");
      }

      setReady(true);
    }

    init();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
    </Stack>
  );
}

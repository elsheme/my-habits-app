import AsyncStorage from "@react-native-async-storage/async-storage";
import { subDays, isBefore, parseISO } from "date-fns";

/**
 * Deletes daily log entries older than 60 days.
 * Called from App.tsx useEffect on every app launch.
 */
export async function cleanOldData(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const logKeys = allKeys.filter((k) => k.startsWith("@dailyLog:"));
    const cutoff = subDays(new Date(), 60);

    const keysToDelete: string[] = [];
    for (const key of logKeys) {
      const dateStr = key.replace("@dailyLog:", "");
      try {
        if (isBefore(parseISO(dateStr), cutoff)) {
          keysToDelete.push(key);
        }
      } catch {
        // invalid date format — safe to delete
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      await AsyncStorage.multiRemove(keysToDelete);
      console.log(`[cleanOldData] Removed ${keysToDelete.length} old log(s).`);
    }
  } catch (error) {
    console.error("[cleanOldData] Failed:", error);
  }
}

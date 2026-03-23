import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "triagenotes_user_id";

/**
 * Generates or retrieves a persistent device-level user ID.
 * Since we use the service role key (bypasses RLS), we don't need
 * Supabase Auth. Instead, we use a UUID stored locally in AsyncStorage
 * to associate notes with this device.
 */
export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      let storedId = await AsyncStorage.getItem(USER_ID_KEY);
      if (!storedId) {
        // Generate a simple UUID v4
        storedId = generateUUID();
        await AsyncStorage.setItem(USER_ID_KEY, storedId);
      }
      setUserId(storedId);
      setLoading(false);
    };
    initUser();
  }, []);

  return { userId, loading };
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

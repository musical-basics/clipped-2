import { useEffect, useState } from "react";

const USER_ID_KEY = "triagenotes_user_id";

/**
 * Generates or retrieves a persistent device-level user ID.
 * Uses localStorage on web, AsyncStorage on native.
 */
export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      try {
        let storedId: string | null = null;

        // Use localStorage on web, AsyncStorage on native
        if (typeof window !== "undefined" && window.localStorage) {
          storedId = window.localStorage.getItem(USER_ID_KEY);
          if (!storedId) {
            storedId = generateUUID();
            window.localStorage.setItem(USER_ID_KEY, storedId);
          }
        } else {
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          storedId = await AsyncStorage.getItem(USER_ID_KEY);
          if (!storedId) {
            storedId = generateUUID();
            await AsyncStorage.setItem(USER_ID_KEY, storedId);
          }
        }

        setUserId(storedId);
      } catch (err) {
        // Fallback: generate a non-persistent UUID
        console.warn("Auth storage failed, using ephemeral ID:", err);
        setUserId(generateUUID());
      } finally {
        setLoading(false);
      }
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

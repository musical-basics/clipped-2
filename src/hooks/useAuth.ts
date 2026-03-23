import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);
      } else {
        const { data } = await supabase.auth.signInAnonymously();
        setUserId(data.session?.user?.id ?? null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  return { userId, loading };
}

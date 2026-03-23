import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { supabase } from "../../src/lib/supabase";
import { Note } from "../../src/types";

export default function VaultScreen() {
  const { userId } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      const fetchStored = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "stored")
          .order("updated_at", { ascending: false });

        if (!error && data) {
          setNotes(data as Note[]);
        }
        setLoading(false);
      };
      fetchStored();
    }, [userId])
  );

  const renderItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      activeOpacity={0.7}
      onPress={() => router.push(`/note/${item.id}`)}
    >
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.noteDate}>
        {new Date(item.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🗄️</Text>
        <Text style={styles.emptyTitle}>Vault is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Swipe right on notes in Review to store them here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vault</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  header: {
    color: "#f9fafb",
    fontSize: 28,
    fontWeight: "800",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  noteItem: {
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  notePreview: {
    color: "#f9fafb",
    fontSize: 15,
    lineHeight: 22,
  },
  noteDate: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#f9fafb",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

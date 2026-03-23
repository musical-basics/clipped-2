import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { cleanupNoteContent, generateEmbedding } from "../../src/services/ai";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [editable, setEditable] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch note on mount
  useEffect(() => {
    const fetchNote = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("content")
        .eq("id", id)
        .single();

      if (!error && data) {
        setText(data.content);
      }
      setLoading(false);
    };
    fetchNote();
  }, [id]);

  // Save edits on blur
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await supabase
        .from("notes")
        .update({
          content: text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {
      Alert.alert("Save Failed", "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  // AI Cleanup (Magic Wand)
  const handleCleanup = async () => {
    setCleaning(true);
    setEditable(false);

    try {
      const cleaned = await cleanupNoteContent(text);
      setText(cleaned);

      const newEmbedding = await generateEmbedding(cleaned);

      await supabase
        .from("notes")
        .update({
          content: cleaned,
          embedding: newEmbedding,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {
      Alert.alert("Cleanup Failed", "Could not clean up this note.");
    } finally {
      setEditable(true);
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {cleaning && (
        <View style={styles.cleaningOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.cleaningText}>Cleaning up...</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        multiline
        editable={editable}
        textAlignVertical="top"
        onBlur={handleSave}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.cleanupButton, cleaning && styles.buttonDisabled]}
          onPress={handleCleanup}
          disabled={cleaning}
          activeOpacity={0.8}
        >
          <Text style={styles.cleanupButtonText}>✨ Clean Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 16,
    lineHeight: 26,
    padding: 20,
    paddingTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  cleanupButton: {
    flex: 1,
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#374151",
  },
  cleanupButtonText: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButtonText: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
  },
  cleaningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17, 24, 39, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  cleaningText: {
    color: "#f9fafb",
    fontSize: 16,
    marginTop: 12,
  },
});

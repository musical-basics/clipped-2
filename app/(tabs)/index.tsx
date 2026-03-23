import { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { generateEmbedding } from "../../src/services/ai";
import { supabase } from "../../src/lib/supabase";

export default function CaptureScreen() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { userId } = useAuth();

  const handleSave = async () => {
    const noteText = text.trim();
    if (!noteText) return;
    if (!userId) {
      console.error("Cannot save: userId is null");
      return;
    }

    // Immediately clear input — zero friction
    setText("");
    setSaving(true);

    try {
      // Generate embedding in background
      const embedding = await generateEmbedding(noteText);

      // Insert into Supabase
      const { error } = await supabase.from("notes").insert({
        user_id: userId,
        content: noteText,
        embedding: embedding,
        status: "inbox",
      });

      if (error) throw error;
    } catch (err) {
      console.error("Save failed:", err);
      if (typeof window !== "undefined") {
        window.alert("Save failed. Check the console for details.");
      }
      // Restore text so user doesn't lose their note
      setText(noteText);
    } finally {
      setSaving(false);
    }

    // Keep keyboard open
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#6b7280"
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        textAlignVertical="top"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!text.trim() || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!text.trim() || saving}
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
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 18,
    lineHeight: 28,
    padding: 20,
    paddingTop: 60,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  saveButton: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#374151",
  },
  saveButtonText: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
  },
});

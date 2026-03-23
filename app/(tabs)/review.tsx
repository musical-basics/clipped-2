import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useNoteStore } from "../../src/store/useNoteStore";
import { useAuth } from "../../src/hooks/useAuth";
import { supabase } from "../../src/lib/supabase";
import { generateEmbedding } from "../../src/services/ai";
import SwipeableCard from "../../src/components/SwipeableCard";
import { Note } from "../../src/types";

export default function ReviewScreen() {
  const { userId } = useAuth();
  const { inboxNotes, setInboxNotes, removeInboxNote, addStoredNote } =
    useNoteStore();
  const [loading, setLoading] = useState(true);
  const [mergeTargets, setMergeTargets] = useState<
    { id: string; content: string; similarity: number }[]
  >([]);
  const [mergingNote, setMergingNote] = useState<Note | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Fetch inbox notes on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      const fetchInbox = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "inbox")
          .order("created_at", { ascending: true });

        if (!error && data) {
          setInboxNotes(data as Note[]);
        }
        setLoading(false);
      };
      fetchInbox();
    }, [userId])
  );

  // Swipe Left → Trash (archive)
  const handleSwipeLeft = useCallback(
    async (note: Note) => {
      removeInboxNote(note.id);
      await supabase
        .from("notes")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", note.id);
    },
    [removeInboxNote]
  );

  // Swipe Right → Keep (store)
  const handleSwipeRight = useCallback(
    async (note: Note) => {
      const updatedNote = { ...note, status: "stored" as const };
      removeInboxNote(note.id);
      addStoredNote(updatedNote);
      await supabase
        .from("notes")
        .update({ status: "stored", updated_at: new Date().toISOString() })
        .eq("id", note.id);
    },
    [removeInboxNote, addStoredNote]
  );

  // Swipe Up → Merge (open bottom sheet with semantic matches)
  const handleSwipeUp = useCallback(
    async (note: Note) => {
      setMergingNote(note);
      setMergeLoading(true);
      bottomSheetRef.current?.present();

      try {
        const { data, error } = await supabase.rpc("match_notes", {
          query_embedding: note.embedding,
          match_threshold: 0.7,
          match_count: 3,
          current_user_id: userId,
        });

        if (error) throw error;
        setMergeTargets(data ?? []);
      } catch {
        Alert.alert("Error", "Could not find matching notes.");
        setMergeTargets([]);
      } finally {
        setMergeLoading(false);
      }
    },
    [userId]
  );

  // Handle merge: append inbox note to selected stored note
  const handleMerge = useCallback(
    async (storedNoteId: string) => {
      if (!mergingNote) return;

      try {
        // Fetch the stored note
        const { data: storedNote } = await supabase
          .from("notes")
          .select("*")
          .eq("id", storedNoteId)
          .single();

        if (!storedNote) throw new Error("Stored note not found");

        // Concatenate content
        const combinedContent = `${storedNote.content}\n\n${mergingNote.content}`;

        // Generate new embedding for combined text
        const newEmbedding = await generateEmbedding(combinedContent);

        // Update the stored note
        await supabase
          .from("notes")
          .update({
            content: combinedContent,
            embedding: newEmbedding,
            updated_at: new Date().toISOString(),
          })
          .eq("id", storedNoteId);

        // Archive the inbox note
        await supabase
          .from("notes")
          .update({ status: "archived", updated_at: new Date().toISOString() })
          .eq("id", mergingNote.id);

        // Log merge event
        await supabase.from("merge_events").insert({
          parent_note_id: storedNoteId,
          child_note_id: mergingNote.id,
        });

        // Update UI
        removeInboxNote(mergingNote.id);
        bottomSheetRef.current?.dismiss();
        setMergingNote(null);
        setMergeTargets([]);
      } catch {
        Alert.alert("Merge Failed", "Could not merge notes. Please try again.");
      }
    },
    [mergingNote, removeInboxNote]
  );

  const handleDismissSheet = useCallback(() => {
    setMergingNote(null);
    setMergeTargets([]);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (inboxNotes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>Inbox Zero!</Text>
        <Text style={styles.emptySubtitle}>
          All caught up. Capture more notes to review.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Card deck — render top 3 */}
      <View style={styles.deckContainer}>
        {inboxNotes
          .slice(0, 3)
          .reverse()
          .map((note, i) => (
            <SwipeableCard
              key={note.id}
              note={note}
              index={2 - i}
              isTop={i === inboxNotes.slice(0, 3).length - 1}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
            />
          ))}
      </View>

      {/* Swipe hints */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>← Trash</Text>
        <Text style={styles.hintText}>↑ Merge</Text>
        <Text style={styles.hintText}>Keep →</Text>
      </View>

      {/* Counter */}
      <Text style={styles.counter}>
        {inboxNotes.length} note{inboxNotes.length !== 1 ? "s" : ""} to review
      </Text>

      {/* Merge Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.6}
          />
        )}
        onDismiss={handleDismissSheet}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Merge with...</Text>

          {mergeLoading ? (
            <ActivityIndicator
              size="large"
              color="#6366f1"
              style={{ marginVertical: 30 }}
            />
          ) : mergeTargets.length === 0 ? (
            <Text style={styles.noMatches}>
              No similar stored notes found.
            </Text>
          ) : (
            mergeTargets.map((target) => (
              <TouchableOpacity
                key={target.id}
                style={styles.matchItem}
                onPress={() => handleMerge(target.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.matchContent} numberOfLines={3}>
                  {target.content}
                </Text>
                <Text style={styles.matchSimilarity}>
                  {Math.round(target.similarity * 100)}% match
                </Text>
              </TouchableOpacity>
            ))
          )}
        </BottomSheetView>
      </BottomSheetModal>
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
  deckContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  hintContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: 8,
  },
  hintText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
  },
  counter: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    paddingBottom: 24,
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
  },
  sheetBackground: {
    backgroundColor: "#1f2937",
  },
  sheetHandle: {
    backgroundColor: "#4b5563",
  },
  sheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  noMatches: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  matchItem: {
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  matchContent: {
    color: "#f9fafb",
    fontSize: 15,
    lineHeight: 22,
  },
  matchSimilarity: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
});

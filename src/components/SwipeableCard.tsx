import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Note } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;
const SWIPE_UP_THRESHOLD = -120;

interface SwipeableCardProps {
  note: Note;
  onSwipeLeft: (note: Note) => void;
  onSwipeRight: (note: Note) => void;
  onSwipeUp: (note: Note) => void;
  isTop: boolean;
  index: number;
}

export default function SwipeableCard({
  note,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  isTop,
  index,
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      // Swipe Left (Trash)
      if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        runOnJS(onSwipeLeft)(note);
        return;
      }

      // Swipe Right (Keep)
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        runOnJS(onSwipeRight)(note);
        return;
      }

      // Swipe Up (Merge)
      if (event.translationY < SWIPE_UP_THRESHOLD) {
        translateY.value = withTiming(-100, { duration: 200 });
        runOnJS(onSwipeUp)(note);
        return;
      }

      // Snap back
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${translateX.value / 15}deg` },
      { scale: interpolate(index, [0, 1, 2], [1, 0.95, 0.9]) },
    ],
  }));

  const trashOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      "clamp"
    ),
  }));

  const keepOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      "clamp"
    ),
  }));

  const mergeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [SWIPE_UP_THRESHOLD, 0],
      [1, 0],
      "clamp"
    ),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          animatedStyle,
          { zIndex: 3 - index, top: index * 8 },
        ]}
      >
        {/* Direction overlays */}
        <Animated.View style={[styles.overlay, styles.trashOverlay, trashOpacity]}>
          <Text style={styles.overlayText}>TRASH</Text>
        </Animated.View>
        <Animated.View style={[styles.overlay, styles.keepOverlay, keepOpacity]}>
          <Text style={styles.overlayText}>KEEP</Text>
        </Animated.View>
        <Animated.View style={[styles.overlay, styles.mergeOverlay, mergeOpacity]}>
          <Text style={styles.overlayText}>MERGE</Text>
        </Animated.View>

        {/* Note content */}
        <Text style={styles.noteContent} numberOfLines={12}>
          {note.content}
        </Text>
        <Text style={styles.noteDate}>
          {new Date(note.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: SCREEN_WIDTH - 40,
    left: 20,
    minHeight: 300,
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  overlay: {
    position: "absolute",
    top: 20,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  trashOverlay: {
    left: 20,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
  },
  keepOverlay: {
    right: 20,
    backgroundColor: "rgba(34, 197, 94, 0.9)",
  },
  mergeOverlay: {
    alignSelf: "center",
    left: "35%",
    backgroundColor: "rgba(99, 102, 241, 0.9)",
  },
  overlayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  noteContent: {
    color: "#f9fafb",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 40,
  },
  noteDate: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 16,
  },
});

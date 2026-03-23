# Implementation Plan 07: Review Mode & Swipe Actions

> **Phases**: 7 + 8 — Review Mode, Swipe Physics, and Vector Merging  
> **Priority**: 🔴 Critical (Core Feature)  
> **Estimated Effort**: ~5 hours

---

## Objective

Build the full Review/Triage experience: a stacked card deck of inbox notes with Tinder-style swipe gestures. Swipe Left = Trash, Swipe Right = Keep, Swipe Up = Merge (opens a bottom sheet with semantic matches). Includes the complete merge flow with vector concatenation and audit logging.

---

## Steps

### 7.1 — Fetch Inbox Notes on Focus

**File**: `app/(tabs)/review.tsx`

- Use `useFocusEffect` to fetch notes from Supabase where `status = 'inbox'`, ordered by `created_at ASC`.
- Load results into Zustand via `setInboxNotes()`.
- Show an empty state when no inbox notes exist.

### 7.2 — Create `SwipeableCard` Component

**File**: `src/components/SwipeableCard.tsx`

- Accepts a `Note` object and callback props: `onSwipeLeft`, `onSwipeRight`, `onSwipeUp`.
- Uses `react-native-reanimated`:
  - `useSharedValue(0)` for `translateX` and `translateY`.
  - `useAnimatedStyle` to map `translateX` → `rotateZ` (e.g., `rotateZ: ${translateX.value / 15}deg`).

### 7.3 — Card Deck Rendering

**In `review.tsx`:**
- Render the top 3 cards from `inboxNotes` using absolute positioning.
- Cards stack naturally: the top card is interactive, cards underneath are slightly scaled down / offset for visual depth.

### 7.4 — Pan Gesture Handling

- Attach `<GestureDetector>` with `Gesture.Pan()` to `SwipeableCard`.
- `.onUpdate`: bind finger movement to `translateX` and `translateY`.
- `.onEnd`: check thresholds:
  - **Left (< -120px)**: animate off-screen left → `onSwipeLeft`.
  - **Right (> +120px)**: animate off-screen right → `onSwipeRight`.
  - **Up (translateY < -120px)**: suspend card → `onSwipeUp`.
  - **Below threshold**: snap back with `withSpring(0)`.

### 7.5 — Direction Overlays

- Absolute-positioned text overlays on the card:
  - **"TRASH"** — opacity increases as X goes negative.
  - **"KEEP"** — opacity increases as X goes positive.
  - **"MERGE"** — opacity increases as Y goes negative.

### 7.6 — Swipe Left (Trash) Action

1. Animate card off-screen left.
2. Optimistically remove from Zustand: `removeInboxNote(id)`.
3. Update Supabase: `status = 'archived'`.

### 7.7 — Swipe Right (Keep) Action

1. Animate card off-screen right.
2. Optimistically remove from Zustand inbox, add to stored: `removeInboxNote(id)`, `addStoredNote(note)`.
3. Update Supabase: `status = 'stored'`.

### 7.8 — Swipe Up (Merge) Action

1. Animate card slightly up and suspend in place.
2. Open `<BottomSheetModal>`.
3. Call `match_notes` RPC with the card's `embedding`:
   ```ts
   const { data } = await supabase.rpc("match_notes", {
     query_embedding: note.embedding,
     match_threshold: 0.7,
     match_count: 3,
     current_user_id: userId,
   });
   ```
4. Show `<ActivityIndicator>` while fetching.
5. Render top 3 semantic matches as a selectable list (truncated text snippets).

### 7.9 — Merge Handler (`handleMerge`)

When user taps a matching note:
1. Fetch the selected stored note's full content.
2. Concatenate: `storedNote.content + "\n\n" + inboxNote.content`.
3. Generate a new embedding for the combined text.
4. Update the stored note in Supabase with combined content and new embedding.
5. Archive the inbox note: set `status = 'archived'`.
6. Insert a record into `merge_events`:
   ```ts
   await supabase.from("merge_events").insert({
     parent_note_id: storedNoteId,
     child_note_id: inboxNoteId,
   });
   ```
7. Close the Bottom Sheet.
8. Animate the suspended card off-screen upward.
9. Render the next inbox card.

---

## Verification

- [ ] Review tab fetches and displays inbox notes as stacked cards.
- [ ] Swiping left archives the note and loads the next card.
- [ ] Swiping right stores the note and loads the next card.
- [ ] Swiping up opens the bottom sheet with 3 semantic matches.
- [ ] Tapping a match merges content, archives the inbox note, and logs to `merge_events`.
- [ ] Card rotation and direction overlays animate smoothly at 60fps.
- [ ] Empty state displays when no inbox notes remain.
- [ ] `npx tsc --noEmit` passes.

---

## Dependencies

- **Upstream**: Plans 01–06 (all foundational layers).
- **Downstream**: None directly — this is the core feature.

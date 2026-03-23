# Implementation Plan 08: Vault & Detail View with AI Cleanup

> **Phases**: 9 + 10 — Vault/Library + Detail View & AI Magic Wand  
> **Priority**: 🟡 High  
> **Estimated Effort**: ~3 hours

---

## Objective

Build the Vault screen (a scrollable list of all stored notes) and the Detail View (full-screen editable note with an AI "Clean Up" magic wand button that reformats messy text using an LLM).

---

## Steps

### 8.1 — Vault Screen (FlatList)

**File**: `app/(tabs)/vault.tsx`

- Fetch all notes where `status = 'stored'`, ordered by `updated_at DESC`.
- Render with `<FlatList>`:
  - Each item shows a **two-line text preview** of the content (truncated).
  - A **formatted date string** (e.g., "Mar 23, 2026").
- Style the list items for readability — proper spacing, subtle dividers.

### 8.2 — Navigation to Detail View

- Wrap each Vault list item with Expo Router navigation:
  ```tsx
  <Link href={`/note/${note.id}`}>
    <VaultListItem note={note} />
  </Link>
  ```
  Or use `router.push(`/note/${note.id}`)` on press.

### 8.3 — Detail View Screen

**File**: `app/note/[id].tsx`

- Extract the `id` using `useLocalSearchParams()`.
- Fetch the full note content from Supabase on mount.
- Render the content inside a full-screen, editable `<TextInput multiline>`.
- Support manual text editing — update Supabase on blur or with a save action.

### 8.4 — "Clean Up" (Magic Wand) Button

- Position a highly visible floating button above the keyboard (similar to the Capture screen's Save button).
- Label: **"Clean Up"** or a wand icon (✨).

### 8.5 — Implement Clean Up Action

**On press:**
1. Disable the `TextInput` (set `editable={false}`).
2. Show a loading indicator (spinner overlay or inline).
3. Call `cleanupNoteContent(rawText)` from `src/services/ai.ts`.
4. Replace the `TextInput` state with the LLM's formatted outline.
5. Re-enable the `TextInput`.
6. Update the content in Supabase.
7. Regenerate the note's embedding vector with `generateEmbedding(newText)` and update in Supabase.

```ts
const handleCleanup = async () => {
  setLoading(true);
  setEditable(false);

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
    .eq("id", noteId);

  setEditable(true);
  setLoading(false);
};
```

### 8.6 — Error Handling

- If the AI call fails, re-enable editing and show an error toast.
- Do not overwrite the original text on failure.

---

## Verification

- [ ] Vault tab displays all stored notes with preview text and dates.
- [ ] Tapping a vault item navigates to `/note/[id]` with the correct content.
- [ ] Manual text editing works and persists to Supabase.
- [ ] Tapping "Clean Up" shows a loading state, then replaces text with a formatted outline.
- [ ] After cleanup, Supabase contains the updated content and a new embedding vector.
- [ ] Errors during cleanup do not corrupt the note content.
- [ ] `npx tsc --noEmit` passes with zero errors.

---

## Dependencies

- **Upstream**: Plans 01–05 (env, DB, types, AI, navigation), Plan 07 (stored notes created via swipe-right).
- **Downstream**: None — this is the final screen implementation.

---

## Final Project Verification

After all 8 plans are implemented, run the full verification suite:

```bash
npx tsc --noEmit          # Zero TypeScript errors
npx expo start            # App launches, all 3 tabs + detail view functional
```

**End-to-end flow test:**
1. Open app → Capture tab → type a note → tap Save → input clears.
2. Switch to Review tab → inbox card appears → swipe right (keep).
3. Switch to Vault tab → stored note appears → tap to open detail.
4. Tap "Clean Up" → text reformats → content updates in Supabase.
5. Go back to Review → swipe up on a note → bottom sheet shows matches → tap to merge.
6. Verify `merge_events` table has a new record.

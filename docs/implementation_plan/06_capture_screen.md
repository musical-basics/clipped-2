# Implementation Plan 06: Frictionless Capture Screen

> **Phase**: 6 — Screen 1: Frictionless Capture  
> **Priority**: 🟡 High  
> **Estimated Effort**: ~2 hours

---

## Objective

Implement the Capture screen (`app/(tabs)/index.tsx`) — a full-screen, borderless text input that opens with the keyboard immediately visible. Saving a note clears the input instantly (zero-friction UX) and asynchronously generates an embedding before inserting the note into Supabase.

---

## Steps

### 6.1 — Full-Screen TextInput

**File**: `app/(tabs)/index.tsx`

- Render a `<TextInput>` that fills the entire screen.
- Set `multiline={true}` and `autoFocus={true}` so the keyboard opens the moment the user lands on the tab.
- Remove all borders and decorations — the screen *is* the text field.

### 6.2 — Keyboard-Aware Layout

- Wrap the view in `<KeyboardAvoidingView behavior="padding">`.
- Position a large, prominent **"Save"** button that floats directly above the keyboard.
- The button should be styled with clear visual affordance (e.g., large touch target, primary color).

### 6.3 — Implement `handleSave`

**On button press:**
1. Capture the current text from state.
2. **Immediately** clear the `TextInput` state (set text to `""`).
3. Keep the keyboard open — do not blur the input.
4. Show a brief, non-blocking success indicator (optional toast/haptic).

**In the background (async, non-blocking):**
1. Call `generateEmbedding(text)` from `src/services/ai.ts`.
2. Wait for the 1536-dimensional vector response.
3. Insert a new row into the Supabase `notes` table:
   ```ts
   await supabase.from("notes").insert({
     user_id: userId,
     content: text,
     embedding: embedding,
     status: "inbox",
   });
   ```

### 6.4 — Error Handling

- If embedding generation or Supabase insert fails, show a non-intrusive error notification.
- Consider queuing failed saves for retry (stretch goal).

---

## Key UX Principles

| Principle | Implementation |
|-----------|---------------|
| Zero friction | Input clears instantly, keyboard stays open |
| Speed | User perceived action is instant; AI/DB work is async |
| Confidence | Brief success indicator confirms save |

---

## Verification

- [ ] Opening the Capture tab immediately shows the keyboard.
- [ ] Typing text and tapping "Save" clears the input and keeps the keyboard open.
- [ ] After saving, the note appears in the Supabase `notes` table with `status = 'inbox'` and a valid `embedding` vector.
- [ ] `npx tsc --noEmit` passes.

---

## Dependencies

- **Upstream**: Plan 01 (env), Plan 02 (Supabase client + notes table), Plan 03 (auth hook for `userId`), Plan 04 (AI `generateEmbedding`), Plan 05 (tab routing).
- **Downstream**: Plan 07 (Review screen reads inbox notes created here).

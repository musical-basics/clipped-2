# Implementation Plan 03: State Management & Data Structures

> **Phase**: 3 — State Management & Data Structures  
> **Priority**: 🔴 Critical (Foundation)  
> **Estimated Effort**: ~1.5 hours

---

## Objective

Define strict TypeScript interfaces for the data model, set up Zustand for global state management with optimistic UI actions, and implement anonymous authentication via Supabase.

---

## Steps

### 3.1 — Create TypeScript Interfaces

**File**: `src/types/index.ts`
```ts
export interface User {
  id: string;        // UUID
  email: string;
  created_at: string; // Timestamptz
}

export interface Note {
  id: string;         // UUID, Primary Key
  user_id: string;    // UUID, Foreign Key
  content: string;
  embedding: number[]; // Vector(1536)
  status: "inbox" | "stored" | "archived";
  created_at: string;
  updated_at: string;
}

export interface MergeEvent {
  id: string;            // UUID, Primary Key
  parent_note_id: string; // UUID — the note kept and appended to
  child_note_id: string;  // UUID — the note archived after merge
  merged_at: string;
}
```

### 3.2 — Install Zustand
```bash
npm install zustand
```

### 3.3 — Create Zustand Note Store

**File**: `src/store/useNoteStore.ts`
```ts
import { create } from "zustand";
import { Note } from "../types";

interface NoteStore {
  inboxNotes: Note[];
  storedNotes: Note[];
  setInboxNotes: (notes: Note[]) => void;
  removeInboxNote: (id: string) => void;
  addStoredNote: (note: Note) => void;
  updateNoteStatus: (id: string, status: Note["status"]) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  inboxNotes: [],
  storedNotes: [],
  setInboxNotes: (notes) => set({ inboxNotes: notes }),
  removeInboxNote: (id) =>
    set((state) => ({
      inboxNotes: state.inboxNotes.filter((n) => n.id !== id),
    })),
  addStoredNote: (note) =>
    set((state) => ({
      storedNotes: [note, ...state.storedNotes],
    })),
  updateNoteStatus: (id, status) =>
    set((state) => ({
      inboxNotes: state.inboxNotes.map((n) =>
        n.id === id ? { ...n, status } : n
      ),
      storedNotes: state.storedNotes.map((n) =>
        n.id === id ? { ...n, status } : n
      ),
    })),
}));
```

### 3.4 — Create Auth Hook

**File**: `src/hooks/useAuth.ts`
- Call `supabase.auth.signInAnonymously()` on app load.
- This ensures every user automatically gets a `user_id` before any note capture.
- Expose the current user's UUID via the hook for downstream use.

```ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
```

---

## Verification

- [ ] `npx tsc --noEmit` passes with zero errors on all new files.
- [ ] TypeScript interfaces in `src/types/index.ts` match the Supabase schema exactly (column names, types).
- [ ] Zustand store actions work correctly (can be verified with a quick test component or console logs).
- [ ] `useAuth` hook successfully obtains an anonymous session when called.

---

## Dependencies

- **Upstream**: Plan 01 (project initialized), Plan 02 (Supabase client configured).
- **Downstream**: Plans 06, 07, 08 rely on the store and auth hook.

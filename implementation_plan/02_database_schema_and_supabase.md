# Implementation Plan 02: Database Schema & Supabase Configuration

> **Phase**: 2 — Database Schema & Supabase Configuration  
> **Priority**: 🔴 Critical (Foundation)  
> **Estimated Effort**: ~2 hours

---

## Objective

Set up the Supabase client in the app, create the database schema (notes, merge_events), enable pgvector, configure RLS policies, and create the `match_notes` RPC function for semantic search.

---

## Steps

### 2.1 — Install Supabase Client
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

### 2.2 — Create `src/lib/supabase.ts`
- Import `react-native-url-polyfill/auto` at the top of the file.
- Initialize the Supabase client using `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Configure `AsyncStorage` for session persistence:
  ```ts
  import "react-native-url-polyfill/auto";
  import { createClient } from "@supabase/supabase-js";
  import AsyncStorage from "@react-native-async-storage/async-storage";

  export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
  ```

### 2.3 — Enable pgvector Extension
**SQL (run manually in Supabase SQL Editor):**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2.4 — Create `notes` Table
**SQL:**
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  status TEXT NOT NULL DEFAULT 'inbox',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 — Create `merge_events` Table
**SQL:**
```sql
CREATE TABLE merge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  child_note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  merged_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.6 — Enable RLS & Create Policies
**SQL:**
```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE merge_events ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE USING (auth.uid() = user_id);

-- Merge events policies (user must own the parent note)
CREATE POLICY "Users can view own merge events"
  ON merge_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = merge_events.parent_note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert own merge events"
  ON merge_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = merge_events.parent_note_id AND notes.user_id = auth.uid()));
```

### 2.7 — Create `match_notes` RPC Function
**SQL:**
```sql
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.content,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE notes.user_id = current_user_id
    AND notes.status = 'stored'
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Verification

- [ ] `src/lib/supabase.ts` compiles without TypeScript errors.
- [ ] All SQL statements execute successfully in Supabase SQL Editor.
- [ ] RLS is enabled on both tables (verify in Supabase dashboard → Authentication → Policies).
- [ ] `match_notes` RPC appears under Database → Functions in the Supabase dashboard.

---

## Dependencies

- **Upstream**: Plan 01 (environment must be set up, `.env` keys populated).
- **Downstream**: Plans 04, 06, 07, 08 all rely on the database and RPC being available.

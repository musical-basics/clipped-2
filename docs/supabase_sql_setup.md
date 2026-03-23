# Supabase SQL Setup

Run these SQL statements in the **Supabase SQL Editor** in order.

## 1. Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 2. Create `notes` Table

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

## 3. Create `merge_events` Table

```sql
CREATE TABLE merge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  child_note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  merged_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Enable RLS & Create Policies

```sql
-- Enable RLS
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

-- Merge events policies
CREATE POLICY "Users can view own merge events"
  ON merge_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = merge_events.parent_note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert own merge events"
  ON merge_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = merge_events.parent_note_id AND notes.user_id = auth.uid()));
```

## 5. Create `match_notes` RPC Function

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

## 6. Enable Anonymous Auth

In Supabase Dashboard → Authentication → Settings → enable **Anonymous Sign-ins**.

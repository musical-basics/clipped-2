# Supabase SQL Setup

Run these SQL statements in the **Supabase SQL Editor** in order.

## 1. Create Schema & Enable pgvector

```sql
CREATE SCHEMA IF NOT EXISTS clipped2;
CREATE EXTENSION IF NOT EXISTS vector;
```

## 2. Create `notes` Table

```sql
CREATE TABLE clipped2.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  status TEXT NOT NULL DEFAULT 'inbox',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Create `merge_events` Table

```sql
CREATE TABLE clipped2.merge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_note_id UUID REFERENCES clipped2.notes(id) ON DELETE SET NULL,
  child_note_id UUID REFERENCES clipped2.notes(id) ON DELETE SET NULL,
  merged_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Create `match_notes` RPC Function

```sql
CREATE OR REPLACE FUNCTION clipped2.match_notes(
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
    n.id,
    n.content,
    1 - (n.embedding <=> query_embedding) AS similarity
  FROM clipped2.notes n
  WHERE n.user_id = current_user_id
    AND n.status = 'stored'
    AND 1 - (n.embedding <=> query_embedding) > match_threshold
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

> **Note:** RLS section removed — service role key bypasses RLS. Anonymous auth section removed — using local device UUID instead.

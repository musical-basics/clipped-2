Perfect choice. React Native with Expo is the ideal stack for a cross-platform app that needs to feel native and handle complex swipe gestures smoothly.

Since you are handing this off to an AI coding agent (like Cursor, Devin, or GitHub Copilot), I have structured this to be as dense, technical, and actionable as possible. You can literally copy and paste everything below this line directly into your agent.

1. Product Requirements Document (PRD)
App Name: (Placeholder: "TriageNotes")
Platform: iOS & Android (Cross-platform)
Core Problem: Traditional note apps cause "digital hoarding." Users capture thoughts but never process them.
Solution: An AI-assisted note app that separates "Capture" from "Processing," using a gamified Tinder-style swipe interface to review, delete, or AI-merge unorganized notes.

Core Features (MVP):

Frictionless Capture: App opens instantly to a text input field and keyboard. Saved notes default to an inbox state.

Review Mode (The Triage): A card-based UI showing one inbox note at a time.

Swipe Left: Delete/Trash.

Swipe Right: Keep/Store (changes status to stored).

Swipe Up (Merge): Triggers a vector database search to find the top 3 most semantically similar stored notes. User taps one to append the current note to it.

Library/Vault: A standard list/grid view to search and read stored notes.

AI Cleanup (Magic Wand): A button on stored notes that triggers an LLM to reformat messy, merged thoughts into a clean, bulleted outline.

2. Technical Stack
Frontend Framework: React Native with Expo (using Expo Router for navigation).

Language: TypeScript (Strict mode enabled).

UI & Animations: * react-native-reanimated (for performant, 60fps animations).

react-native-gesture-handler (for the swipeable Review cards).

Tailwind CSS (via NativeWind) or generic StyleSheet for styling.

Backend & Database: Supabase (PostgreSQL).

Must enable the pgvector extension for semantic search.

AI / Machine Learning: * Embeddings: OpenAI text-embedding-3-small (generates 1536-dimensional vectors) OR Google Gemini API.

LLM Processing: OpenAI gpt-4o-mini or Gemini 1.5 Flash (for fast, cheap summarization and text cleanup).

3. Data Structures (Database Schema & TypeScript Types)
Tell your AI agent to set up the following Supabase tables and TypeScript interfaces. Note: Ensure the vector column matches the embedding model's dimensions (e.g., 1536).

TypeScript

// 1. Users (Handled primarily by Supabase Auth, but good to extend)
interface User {
  id: string; // UUID
  email: string;
  created_at: string; // Timestamptz
}

// 2. Notes (The Core Engine)
interface Note {
  id: string; // UUID, Primary Key
  user_id: string; // UUID, Foreign Key to Users
  content: string; // Text
  embedding: number[]; // Vector(1536) for semantic matching
  status: 'inbox' | 'stored' | 'archived'; // Default: 'inbox'
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}

// 3. Merges (Audit trail for undone merges)
interface MergeEvent {
  id: string; // UUID, Primary Key
  parent_note_id: string; // UUID, the note kept and appended to
  child_note_id: string; // UUID, the note swallowed
  merged_at: string; // Timestamptz
}
Required Supabase RPC (Remote Procedure Call) for the Agent:
The agent must create a Postgres function to perform the vector similarity search.

Function name: match_notes

Parameters: query_embedding (vector), match_threshold (float), match_count (int), current_user_id (uuid).

Logic: Compare query_embedding against Notes.embedding using cosine distance (<=>), filter by user_id, filter by status = 'stored', and return the top match_count records.

4. User Flow & Screen Architecture
Screen 1: Capture (Initial Route /)

User opens app.

UI focuses immediately on a large TextInput. Keyboard opens automatically.

User types thought -> Taps "Save".

Background Action: App sends text to AI API -> receives Embedding -> Saves Note to Supabase with status: 'inbox' and the generated Embedding. Text input clears.

Screen 2: Review Mode (Route /review)

App queries Supabase for Notes where status = 'inbox', ordered by oldest.

UI renders the first note as a Draggable Card.

User Swipes Left: Note status updates to archived. Next card loads.

User Swipes Right: Note status updates to stored. Next card loads.

User Swipes Up:

App calls Supabase match_notes RPC using the current card's embedding.

UI slides up a Bottom Sheet displaying the top 3 matching stored notes.

User taps a matching note.

Background Action: Current note content is appended to the selected stored note. Current note status changes to archived. Log written to MergeEvent table. Next card loads.

Screen 3: Vault / Library (Route /vault)

FlatList rendering all notes where status = 'stored', ordered by updated_at descending.

Tapping a note routes to Detail View.

Screen 4: Detail View (Route /note/[id])

Displays full note content in a multiline TextInput for manual editing.

"Clean Up" button floating on screen.

Action: Tapping button sends note content and a specific System Prompt to the LLM.

Background Action: LLM returns formatted text. UI updates instantly. Supabase content is updated.
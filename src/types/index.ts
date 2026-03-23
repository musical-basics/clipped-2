export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  embedding: number[];
  status: "inbox" | "stored" | "archived";
  created_at: string;
  updated_at: string;
}

export interface MergeEvent {
  id: string;
  parent_note_id: string;
  child_note_id: string;
  merged_at: string;
}

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

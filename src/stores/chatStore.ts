import { create } from "zustand";

interface ChatSession {
  id: string;
  title: string;
  chats: { success: boolean; content: string; role: "user" | "bot"; sentiment?: string; isNew?: boolean }[];
  temp?: boolean;
}

interface ChatStore {
  sessions: ChatSession[];
  selectedSessionId: string | null;
  setSessions: (sessions: ChatSession[]) => void;
  setSelectedSessionId: (id: string | null) => void;
  addSession: (session: ChatSession) => void;
  updateSessionMessages: (id: string, messages: ChatSession["chats"]) => void;
  updateSessionTitle: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  selectedSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  setSelectedSessionId: (id) => set({ selectedSessionId: id }),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSessionMessages: (id, messages) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, chats: messages } : s)),
    })),
  updateSessionTitle: (id, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, title } : s)),
    })),
  deleteSession: (id) =>
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      const newSelectedSessionId = state.selectedSessionId === id ? (newSessions[0]?.id || null) : state.selectedSessionId;
      return { sessions: newSessions, selectedSessionId: newSelectedSessionId };
    }),
}));
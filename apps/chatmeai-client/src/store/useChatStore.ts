import { create } from 'zustand'
import type { Message } from '@/types/chat'

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  isThinking: boolean
  conversationId: string | null
  addMessage: (message: Message) => void
  appendDelta: (id: string, delta: string) => void
  setStreaming: (value: boolean) => void
  setThinking: (value: boolean) => void
  resetChat: () => void
  setConversationId: (id: string | null) => void
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  isThinking: false,
  conversationId: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  appendDelta: (id, delta) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + delta } : m
      ),
    })),
  setStreaming: (value) => set({ isStreaming: value }),
  setThinking: (value) => set({ isThinking: value }),
  resetChat: () =>
    set({ messages: [], conversationId: null, isStreaming: false, isThinking: false }),
  setConversationId: (id) => set({ conversationId: id }),
}))

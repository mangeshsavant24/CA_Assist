import { create } from 'zustand'

export type ActiveTab = 'chat' | 'regime' | 'document'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  timestamp: Date
}

interface AppStore {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  
  chatHistory: Message[]
  addMessage: (message: Message) => void
  clearChat: () => void
  
  sessionId: string
  initSession: () => void
  
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  chatHistory: [],
  addMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message],
  })),
  clearChat: () => set({ chatHistory: [] }),
  
  sessionId: '',
  initSession: () => set({ sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))

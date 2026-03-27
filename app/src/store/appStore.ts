import { create } from 'zustand'
import type { Citation } from '@/lib/api'

export type ActiveTab = 'home' | 'chat' | 'regime' | 'document' | 'fund'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[] | string[]
  agent?: 'TAX_QUERY' | 'GST_QUERY' | 'ADVISORY' | 'DOCUMENT_ANALYSIS'
  timestamp: Date
}

interface AppStore {
  // Tab & UI
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  
  // Chat
  chatHistory: Message[]
  addMessage: (message: Message) => void
  clearChat: () => void
  
  // Session & Auth
  sessionId: string
  userId: string
  initSession: () => void
  
  // Authentication
  accessToken: string | null
  setAccessToken: (token: string | null) => void
  isAuthenticated: boolean
  logout: () => void
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  // Tab & UI
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Chat
  chatHistory: [],
  addMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message],
  })),
  clearChat: () => set({ chatHistory: [] }),
  
  // Session & Auth
  sessionId: '',
  userId: '',
  initSession: () => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Try to load token from localStorage
    const storedToken = localStorage.getItem('accessToken')
    
    set({ sessionId, userId, accessToken: storedToken || null })
  },
  
  // Authentication
  accessToken: null,
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.removeItem('accessToken')
    }
    set({ accessToken: token })
  },
  isAuthenticated: false,
  logout: () => {
    localStorage.removeItem('accessToken')
    set({ 
      accessToken: null, 
      isAuthenticated: false,
      chatHistory: []
    })
  },
  
  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))

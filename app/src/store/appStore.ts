import { create } from 'zustand'
import type { Citation } from '@/lib/api'

export type ActiveTab = 'home' | 'chat' | 'regime' | 'document' | 'fund' | 'forex'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[] | string[]
  agent?: 'TAX_QUERY' | 'GST_QUERY' | 'ADVISORY' | 'DOCUMENT_ANALYSIS'
  timestamp: Date
}

export interface UploadedDocument {
  id: string
  filename: string
  documentType: 'salary_slip' | 'form16' | 'invoice' | unknown
  uploadedAt: Date
  fileSize: number
  extractedData?: Record<string, any>
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
  
  // Document Management
  userDocuments: UploadedDocument[]
  addUserDocument: (doc: UploadedDocument) => void
  removeUserDocument: (docId: string) => void
  documentExtractedData: Record<string, any> | null
  setDocumentExtractedData: (data: Record<string, any> | null) => void
  
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
    
    // FIXED: Set isAuthenticated flag based on whether token was restored
    set({ sessionId, userId, accessToken: storedToken || null, isAuthenticated: !!storedToken })
    // FIXED: Set isAuthenticated flag based on whether token was restored
    set({ sessionId, userId, accessToken: storedToken || null, isAuthenticated: !!storedToken })
  },
  
  // Authentication
  accessToken: null,
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token)
      set({ accessToken: token, isAuthenticated: true })
    } else {
      localStorage.removeItem('accessToken')
      set({ accessToken: null, isAuthenticated: false })
    }
  },
  isAuthenticated: false,
  logout: () => {
    localStorage.removeItem('accessToken')
    set({ 
      accessToken: null, 
      isAuthenticated: false,
      chatHistory: [],
      activeTab: 'home',
      userDocuments: [],
      documentExtractedData: null
    })
  },
  
  // Document Management
  userDocuments: [],
  addUserDocument: (doc) => set((state) => ({
    userDocuments: [...state.userDocuments, doc],
  })),
  removeUserDocument: (docId) => set((state) => ({
    userDocuments: state.userDocuments.filter((doc) => doc.id !== docId),
  })),
  documentExtractedData: null,
  setDocumentExtractedData: (data) => set({ documentExtractedData: data }),
  
  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))

import { create } from 'zustand'
import { getCurrentUserAPI } from '@/lib/api'
import type { Citation, UserResponse } from '@/lib/api'

export type ActiveTab = 'home' | 'chat' | 'regime' | 'document' | 'fund' | 'forex' | 'capital'

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
  documentType: 'salary_slip' | 'form16' | 'invoice' | string
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
  updateMessage: (id: string, updates: Partial<Message>) => void
  clearChat: () => void
  chatDocumentContext: { filename: string; data: Record<string, any> } | null
  setChatDocumentContext: (context: { filename: string; data: Record<string, any> } | null) => void
  
  // Session & Auth
  sessionId: string
  userId: string
  currentUser: UserResponse | null
  setCurrentUser: (user: UserResponse | null) => void
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
  
  // Autofill Context
  regimeAutofill: Record<string, any> | null
  forexAutofill: Record<string, any> | null
  fundAutofill: Record<string, any> | null
  chatContext: Record<string, any> | null
  documentRefreshCount: number
  
  setRegimeAutofill: (data: Record<string, any> | null) => void
  setForexAutofill: (data: Record<string, any> | null) => void
  setFundAutofill: (data: Record<string, any> | null) => void
  setChatContext: (data: Record<string, any> | null) => void
  clearRegimeAutofill: () => void
  clearForexAutofill: () => void
  clearFundAutofill: () => void
  clearChatContext: () => void
  incrementDocumentRefresh: () => void
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
  updateMessage: (id, updates) => set((state) => ({
    chatHistory: state.chatHistory.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    ),
  })),
  clearChat: () => set({ chatHistory: [], chatDocumentContext: null }),
  chatDocumentContext: null,
  setChatDocumentContext: (context) => set({ chatDocumentContext: context }),
  
  // Session & Auth
  sessionId: '',
  userId: '',
  initSession: async () => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Try to load token and userId from localStorage
    const storedToken = localStorage.getItem('accessToken')
    const storedUserId = localStorage.getItem('userId') || ''

    if (storedToken) {
      set({ sessionId, userId: storedUserId, accessToken: storedToken, isAuthenticated: true })
      try {
        const user = await getCurrentUserAPI()
        set({ userId: user.id, currentUser: user })
      } catch (error) {
        // invalid token, clear out
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userId')
        set({ accessToken: null, isAuthenticated: false, userId: '', currentUser: null })
      }
    } else {
      set({ sessionId, userId: '', accessToken: null, isAuthenticated: false, currentUser: null })
    }
  },
  
  // Authentication
  accessToken: null,
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token)
      set({ accessToken: token, isAuthenticated: true })
    } else {
      localStorage.removeItem('accessToken')
      set({ accessToken: null, isAuthenticated: false, userId: '', currentUser: null })
    }
  },
  isAuthenticated: false,
  currentUser: null,
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('userId', user.id)
    } else {
      localStorage.removeItem('userId')
    }
    set({ currentUser: user, userId: user?.id || '' })
  },
  logout: () => {
    localStorage.removeItem('accessToken')
    set({ 
      accessToken: null, 
      isAuthenticated: false,
      chatHistory: [],
      activeTab: 'home',
      userDocuments: [],
      documentExtractedData: null,
      chatDocumentContext: null
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
  
  // Autofill Context
  regimeAutofill: null,
  forexAutofill: null,
  fundAutofill: null,
  chatContext: null,
  documentRefreshCount: 0,
  
  setRegimeAutofill: (data) => set({ regimeAutofill: data }),
  setForexAutofill: (data) => set({ forexAutofill: data }),
  setFundAutofill: (data) => set({ fundAutofill: data }),
  setChatContext: (data) => set({ chatContext: data }),
  clearRegimeAutofill: () => set({ regimeAutofill: null }),
  clearForexAutofill: () => set({ forexAutofill: null }),
  clearFundAutofill: () => set({ fundAutofill: null }),
  clearChatContext: () => set({ chatContext: null }),
  incrementDocumentRefresh: () => set((state) => ({ documentRefreshCount: state.documentRefreshCount + 1 })),
}))

export const useAppContext = () => useAppStore()

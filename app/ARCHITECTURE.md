# CA-Assist Frontend - Architecture & Flow

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Frontend)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │         App.tsx (Main Entry Point)                       │  │
│   │  - Route between pages based on activeTab                │  │
│   │  - Initialize session on mount                           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              ▲                                    │
│                              │                                    │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│    ┌─────────┐          ┌─────────┐         ┌──────────┐      │
│    │ Sidebar │          │ ChatPage│         │RegimePage│      │
│    │  Nav    │          │         │         │          │      │
│    └─────────┘          └─────────┘         └──────────┘      │
│         │                    │                    │             │
│         └────────────────────┼────────────────────┘             │
│                              │                                  │
│              ┌───────────────▼───────────────┐                 │
│              │   useAppStore (Zustand)       │                 │
│              │  • activeTab                  │                 │
│              │  • chatHistory                │                 │
│              │  • sessionId                  │                 │
│              │  • isLoading                  │                 │
│              └───────────────┬───────────────┘                 │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Axios API Client  │
                    │  (api.ts)           │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌──────────────┐ ┌─────────┐ ┌──────────────┐
        │POST /query   │ │POST     │ │POST /document│
        │(Chat)        │ │/regime/ │ │/upload       │
        │              │ │compare  │ │              │
        └──────────────┘ └─────────┘ └──────────────┘
                │              │              │
                └──────────────┼──────────────┘
                               │
        ┌──────────────────────▼───────────────────────┐
        │      FastAPI Backend (http://             │
        │      localhost:8000)                       │
        └───────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### Chat Flow
```
User Input
    │
    ▼
[ChatPage Component]
    │
    ├─ setIsLoading(true)
    │
    ▼
[queryAPI() call]
    │
    ▼
[Backend /query endpoint]
    │
    ▼
[Orchestrator + Agent Processing]
    │
    ▼
[CitedResponse returned]
    │
    ├─ Update store: addMessage()
    ├─ setIsLoading(false)
    │
    ▼
[Display message + citations]
```

### Regime Calculator Flow
```
User Input (income, deductions)
    │
    ▼
[Form validation]
    │
    ├─ Error? → Display error message
    │
    ▼
[compareRegimeAPI() call]
    │
    ▼
[Backend /regime/compare endpoint]
    │
    ▼
[Tax calculations for both regimes]
    │
    ▼
[RegimeOutput with verdict]
    │
    ├─ setResult(response)
    ├─ setIsLoading(false)
    │
    ▼
[Display results + recommendation]
```

### Document Upload Flow
```
File Selection
    │
    ├─ Validation (type, size)
    ├─ Error? → Show error
    │
    ▼
[User clicks Upload]
    │
    ├─ setIsUploading(true)
    │
    ▼
[uploadDocumentAPI(file)]
    │
    ▼
[Backend /document/upload with FormData]
    │
    ▼
[Document processing (PDF/image)]
    │
    ▼
[CitedResponse returned]
    │
    ├─ setResult(response)
    ├─ setIsUploading(false)
    │
    ▼
[Display analysis + citations]
```

---

## 📦 Component Hierarchy

```
App
├── Sidebar
│   ├── Chat Nav Button
│   ├── Regime Nav Button
│   ├── Document Nav Button
│   └── Disclaimer Text
│
├── ChatPage (if activeTab === 'chat')
│   ├── Header
│   │   ├── Title
│   │   └── Description
│   │
│   ├── Messages Area
│   │   ├── Empty State (if no messages)
│   │   │   ├── Title
│   │   │   ├── Description
│   │   │   └── Examples
│   │   │
│   │   └── Message List (if messages exist)
│   │       ├── Message Item (User)
│   │       │   ├── Content
│   │       │   └── Timestamp
│   │       │
│   │       ├── Message Item (Assistant)
│   │       │   ├── Content
│   │       │   ├── Citations (if any)
│   │       │   └── Timestamp
│   │       │
│   │       └── Loading Indicator (if isLoading)
│   │
│   └── Input Area
│       ├── Input Field
│       └── Send Button
│
├── RegimeCalculatorPage (if activeTab === 'regime')
│   ├── Header
│   │   ├── Title
│   │   └── Description
│   │
│   ├── Input Form (if !result)
│   │   ├── Card (CardHeader, CardContent)
│   │   │   ├── Error Alert (if error)
│   │   │   ├── Gross Income Input
│   │   │   ├── Section 80C Input
│   │   │   ├── Section 80D Input
│   │   │   ├── HRA Exemption Input
│   │   │   └── Calculate Button
│   │
│   └── Results (if result)
│       ├── Verdict Card (Emerald themed)
│       │   ├── Recommendation
│       │   ├── Reason
│       │   ├── Tax Saving (amount)
│       │   └── Saving % (percentage)
│       │
│       ├── Two RegimeCard Components
│       │   ├── Old Regime Card
│       │   │   ├── Taxable Income
│       │   │   ├── Deductions
│       │   │   ├── Tax Slabs
│       │   │   ├── Base Tax
│       │   │   ├── Cess
│       │   │   ├── Rebate
│       │   │   └── Total Tax
│       │   │
│       │   └── New Regime Card
│       │       └── (same structure)
│       │
│       ├── Citations Card (if citations exist)
│       │   └── Badge list
│       │
│       └── Calculate Another Button
│
└── DocumentUploadPage (if activeTab === 'document')
    ├── Header
    │   ├── Title
    │   └── Description
    │
    ├── Upload Form (if !result)
    │   ├── Card (CardHeader, CardContent)
    │   │   ├── Error Alert (if error)
    │   │   ├── Drop Zone
    │   │   │   ├── Upload Icon
    │   │   │   └── Instructions
    │   │   │
    │   │   ├── File Info (if file selected)
    │   │   │   ├── File name
    │   │   │   └── File size
    │   │   │
    │   │   ├── Upload & Analyze Button
    │   │   ├── Cancel Button
    │   │   │
    │   │   └── Supported Documents Info
    │
    └── Results (if result)
        ├── Success Header
        │   └── CheckCircle Icon
        │
        ├── Extracted Information
        │   └── Analysis text
        │
        ├── References (if citations)
        │   └── Badge list
        │
        └── Upload Another Document Button
```

---

## 🔀 State Management Flow

```
┌─────────────────────────────────────┐
│       useAppStore (Zustand)         │
├─────────────────────────────────────┤
│                                     │
│  activeTab: 'chat' | 'regime'       │
│    ├─ read in: App.tsx              │
│    └─ set by: Sidebar onclick       │
│                                     │
│  chatHistory: Message[]             │
│    ├─ read in: ChatPage             │
│    └─ set by: addMessage()          │
│                                     │
│  sessionId: string                  │
│    ├─ read in: ChatPage, DocPage    │
│    └─ set by: initSession() (once)  │
│                                     │
│  isLoading: boolean                 │
│    ├─ read in: All pages            │
│    └─ set by: API handlers          │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 Styling Layers

```
┌──────────────────────────────────────────────────────┐
│          Styling Architecture                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Layer 1: Tailwind Base Classes                     │
│  ├─ bg-slate-950, text-slate-50                    │
│  ├─ rounded-lg, shadow-lg                          │
│  └─ hover:, focus:, disabled: states               │
│                                                      │
│  Layer 2: Component-Local Classes                  │
│  ├─ Inline Tailwind in JSX                         │
│  └─ cn() utility for conditional classes           │
│                                                      │
│  Layer 3: Global Custom Classes (index.css)        │
│  ├─ .card-base, .card-hover                        │
│  ├─ .btn-primary, .btn-secondary                   │
│  ├─ .amount (currency styling)                     │
│  └─ .citation-badge, .state-success                │
│                                                      │
│  Layer 4: Design Tokens (tailwind.config.ts)       │
│  ├─ Colors: primary, surface, border               │
│  ├─ Typography: DM Sans, DM Mono                   │
│  └─ Spacing, border-radius, shadows                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔌 API Integration Points

```
Frontend                          Backend
┌──────────────────────────────────────────────┐
│                                              │
│  queryAPI({query, user_id})                  │
│         │                                    │
│         ▼                                    │
│  POST /query                                 │
│         │                                    │
│         ├─ Orchestrator classifies intent   │
│         ├─ Routes to appropriate agent      │
│         ├─ Agent fetches RAG docs           │
│         ├─ LLM generates response           │
│         ├─ Citations extracted              │
│         │                                    │
│         ◀─ CitedResponse                     │
│         │                                    │
│  {answer, citations}                         │
│                                              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                                              │
│  compareRegimeAPI({gross_income, ...})       │
│         │                                    │
│         ▼                                    │
│  POST /regime/compare                        │
│         │                                    │
│         ├─ Regime Engine processes          │
│         ├─ Calculates taxes (old + new)     │
│         ├─ Applies deductions               │
│         ├─ Compares results                 │
│         │                                    │
│         ◀─ RegimeOutput                      │
│         │                                    │
│  {old_regime, new_regime, verdict, ...}     │
│                                              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                                              │
│  uploadDocumentAPI(file, userId)             │
│         │                                    │
│         ▼                                    │
│  POST /document/upload (FormData)            │
│         │                                    │
│         ├─ Document processing (PDF/image) │
│         ├─ Text extraction                  │
│         ├─ RAG retrieval                    │
│         ├─ LLM analysis                     │
│         │                                    │
│         ◀─ CitedResponse                     │
│         │                                    │
│  {answer, citations}                         │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🔑 Key Integration Points

### 1. Session Management
```
App.tsx (useEffect on mount)
  └─ useAppStore.initSession()
     └─ Generate unique sessionId
        └─ Pass to all API calls
```

### 2. Loading States
```
All API calls
  └─ Before: setIsLoading(true)
  ├─ Success: setIsLoading(false)
  └─ Error: setIsLoading(false) + show error
```

### 3. Message Persistence
```
ChatPage
  └─ addMessage(userMsg)
  ├─ Call API
  └─ addMessage(aiMsg)
     └─ Stored in useAppStore.chatHistory
```

### 4. Error Handling
```
Try/Catch in all components
  ├─ API errors → Display error message
  ├─ Validation errors → Field-level errors
  └─ User feedback → Toast or alert
```

---

## 🚀 Performance Considerations

```
Frontend Optimization:
├─ Component lazy loading (React.lazy)
├─ State updates batched (Zustand)
├─ Messages virtualized (for large lists)
├─ API calls debounced (if search/filter)
│
Tailwind Optimization:
├─ JIT mode (on-demand class generation)
├─ Purging unused styles (production)
├─ Minification of CSS
│
Build Optimization:
├─ Code splitting (routes)
├─ Tree shaking (remove unused code)
├─ Minification (JS & CSS)
├─ Gzip compression (server)
└─ Lazy load icons (lucide-react)
```

---

**This architecture ensures clean separation of concerns, maintainability, and scalability! 🎯**

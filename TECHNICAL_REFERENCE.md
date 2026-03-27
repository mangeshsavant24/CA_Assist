# CA-Assist: Technical Integration Reference

## System Architecture

### Frontend Architecture

```
┌────────────────────────────────────────────────┐
│          React Application (Vite)              │
├────────────────────────────────────────────────┤
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  App.tsx (Router & Layout)              │  │
│  │  - Manages active route                 │  │
│  │  - Handles authentication redirect      │  │
│  │  - Renders appropriate component        │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  useAppStore (Zustand)                  │  │
│  │  - activeTab: home|chat|regime|...      │  │
│  │  - accessToken: JWT or null             │  │
│  │  - isAuthenticated: boolean             │  │
│  │  - chatHistory: Message[]               │  │
│  │  - sessionId: string                    │  │
│  │  - userId: string                       │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  Components (React.FC)                  │  │
│  │  ├─ AuthModal (login/register)          │  │
│  │  ├─ HomeScreen (landing)                │  │
│  │  ├─ ChatScreen (tax Q&A)                │  │
│  │  ├─ RegimeCalculator                    │  │
│  │  ├─ FundAccounting (NEW)                │  │
│  │  └─ DocumentUpload                      │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  API Client (Axios)                     │  │
│  │  ├─ Request Interceptor                 │  │
│  │  │  └─ Adds: Authorization header       │  │
│  │  ├─ Response Interceptor                │  │
│  │  │  └─ Handles 401 → logout             │  │
│  │  └─ API Functions                       │  │
│  │     ├─ loginAPI()                       │  │
│  │     ├─ registerAPI()                    │  │
│  │     ├─ queryAPI()                       │  │
│  │     ├─ compareRegimeAPI()               │  │
│  │     ├─ calculateFundNAVAPI()            │  │
│  │     ├─ uploadDocumentAPI()              │  │
│  │     └─ getHealthAPI()                   │  │
│  └─────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌────────────────────────────────────────────────┐
│        FastAPI Application                     │
├────────────────────────────────────────────────┤
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  API Main (api/main.py)                 │  │
│  │  - Register routers                     │  │
│  │  - Add CORS middleware                  │  │
│  │  - Initialize database                  │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  Routers (Protected by JWT)             │  │
│  │  ├─ /auth                               │  │
│  │  │  ├─ POST /login                      │  │
│  │  │  └─ POST /register                   │  │
│  │  ├─ /query                              │  │
│  │  │  └─ POST / (RAG-based Q&A)           │  │
│  │  ├─ /regime                             │  │
│  │  │  └─ POST /compare                    │  │
│  │  ├─ /fund                               │  │
│  │  │  └─ POST /nav                        │  │
│  │  ├─ /document                           │  │
│  │  │  └─ POST /upload                     │  │
│  │  └─ /capital-budget                     │  │
│  │     └─ POST /evaluate                   │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  Engines (Business Logic)               │  │
│  │  ├─ RegimeEngine (tax calculations)     │  │
│  │  ├─ FundAccountingEngine (NAV calc)     │  │
│  │  ├─ CitationEngine (legal references)   │  │
│  │  └─ CapitalBudgetingEngine              │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  Agents (Intent Routing)                │  │
│  │  ├─ TaxAgent                            │  │
│  │  ├─ GSTAgent                            │  │
│  │  ├─ AdvisoryAgent                       │  │
│  │  └─ DocumentAgent                       │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  RAG System                             │  │
│  │  ├─ Embedder (Sentence Transformers)    │  │
│  │  ├─ Retriever (ChromaDB)                │  │
│  │  ├─ Ingest (PDF processing)             │  │
│  │  └─ LLM (OpenAI or Ollama)              │  │
│  └─────────────────────────────────────────┘  │
│                       ↓                        │
│  ┌─────────────────────────────────────────┐  │
│  │  Data Layer                             │  │
│  │  ├─ Database (SQLite)                   │  │
│  │  │  ├─ Users table (auth)               │  │
│  │  │  └─ Documents table (metadata)       │  │
│  │  └─ Vector DB (ChromaDB)                │  │
│  │     └─ Tax law embeddings (FAQ)         │  │
│  └─────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Authentication Flow

```
Frontend                              Backend
├─ User clicks "Sign In"
│
├─ AuthModal opens
│
├─ User enters: email, password
│
├─ User clicks "Create Account"
│                                    ├─ POST /auth/register
│  ────────────────────────────────→ ├─ Check if email exists
│                                    ├─ Hash password
│                                    ├─ Create User in DB
│                                    ├─ Return UserResponse
│  ←────────────────────────────────
│
├─ If successful, auto-login
│
├─ User submits login (email, pwd)
│                                    ├─ POST /auth/login
│  ────────────────────────────────→ ├─ Find User by email
│                                    ├─ Verify password
│                                    ├─ Generate JWT token
│                                    ├─ Return { token, expires_in }
│  ←────────────────────────────────
│
├─ Token stored in localStorage
│
├─ Zustand state updated:
│  - accessToken = token
│  - isAuthenticated = true
│
├─ Modal closes
│
├─ Redirected to home/feature
```

### Protected API Call Flow

```
Frontend                              Backend
├─ User makes request (e.g., query)
│
├─ Axios interceptor triggers:
│  - Reads accessToken from Zustand
│  - Adds header: Authorization: Bearer token
│
├─ POST /query with Authorization header
│  ────────────────────────────────→ ├─ Extract token from header
│                                    ├─ Verify token signature
│                                    ├─ Extract user_id from token
│                                    ├─ Dependency: get_current_user()
│                                    ├─ Process request
│                                    ├─ Return response
│  ←────────────────────────────────
│
├─ Response received
│
├─ Check status code:
│  ├─ 200: Update UI with data
│  ├─ 401: Token expired/invalid
│  │  ├─ Interceptor catches 401
│  │  ├─ Call logout()
│  │  ├─ Show login modal
│  │  └─ Clear localStorage
│  └─ 500: Show error message
```

### Fund Accounting Calculation Flow

```
User Interface                    API                         Backend Engine
├─ User enters fund data
│  ├─ Fund name
│  ├─ Fund type
│  ├─ Opening balance
│  └─ Transactions list
│
├─ Add transactions:
│  ├─ Type (contribution/withdrawal/return)
│  ├─ Amount
│  ├─ Date
│  └─ Description
│
├─ Click "Calculate NAV"
│                                  ├─ POST /fund/nav
│  ──────────────────────────────→ ├─ Extract request body
│                                  ├─ Validate data
│                                  │
│                                  ├─ Call FundAccountingEngine
│                                  │  ├─ Process transactions
│                                  │  ├─ Calculate closing balance
│                                  │  ├─ Compute NAV per unit
│                                  │  ├─ Calculate ROI %
│                                  │  ├─ Generate ledger entries
│                                  │  └─ Prepare recommendation
│                                  │
│                                  ├─ Return FundOutput
│  ←────────────────────────────── ├─ {
│                                  │   nav_detail: { ... },
│                                  │   recommendation: "...",
│                                  │   currency: "INR"
│                                  │ }
│
├─ Display results:
│  ├─ Closing balance
│  ├─ NAV per unit
│  ├─ ROI percentage
│  └─ Recommendation
```

## Type System

### API Request/Response Types

```typescript
// Authentication
interface UserRegister {
  email: string
  password: string
  full_name?: string
}

interface UserLogin {
  username: string // email
  password: string
}

interface AuthToken {
  access_token: string
  token_type: string // "bearer"
  expires_in: number // seconds
}

// Query
interface QueryRequest {
  query: string
  user_id: string
}

interface CitedResponse {
  answer: string
  citations: Citation[]
}

// Regime
interface RegimeInput {
  gross_income: number
  sec_80c?: number // Section 80C deduction
  sec_80d?: number // Health insurance premium
  hra_exemption?: number
  other_deductions?: number
}

interface RegimeOutput {
  old_regime: RegimeDetail
  new_regime: RegimeDetail
  verdict: {
    recommended_regime: string
    tax_saving: number
    saving_percentage: number
    reason: string
  }
  citations: string[]
}

// Fund
interface FundInput {
  fund_name: string
  fund_type: 'General' | 'Endowment' | 'Restricted' | 'Other'
  opening_balance: number
  share_classes?: number
  transactions: FundTransaction[]
  currency?: 'INR' | 'USD'
}

interface FundOutput {
  nav_detail: NAVDetail
  recommendation: string
  currency: 'INR' | 'USD'
}

interface FundTransaction {
  transaction_type: 'contribution' | 'withdrawal' | 'return'
  amount: number
  date?: string
  description?: string
}
```

### Zustand Store Schema

```typescript
interface AppStore {
  // UI State
  activeTab: 'home' | 'chat' | 'regime' | 'document' | 'fund'
  setActiveTab: (tab: ActiveTab) => void

  // Chat State
  chatHistory: Message[]
  addMessage: (message: Message) => void
  clearChat: () => void

  // Session State
  sessionId: string
  userId: string
  initSession: () => void

  // Auth State
  accessToken: string | null
  setAccessToken: (token: string | null) => void
  isAuthenticated: boolean
  logout: () => void

  // Loading State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  hashed_password VARCHAR NOT NULL,
  full_name VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  filename VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  doc_type VARCHAR,
  extracted_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## API Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | ✅ Success | Query processed successfully |
| 201 | ✅ Created | User registered successfully |
| 400 | ❌ Bad Request | Invalid input data |
| 401 | ❌ Unauthorized | Missing/invalid JWT token |
| 403 | ❌ Forbidden | User not authorized |
| 404 | ❌ Not Found | Endpoint doesn't exist |
| 422 | ❌ Validation Error | Pydantic validation failed |
| 500 | ❌ Server Error | Unexpected backend error |

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
# Set to production API when deploying
```

### Backend (.env)
```
# LLM Configuration
OPENAI_API_KEY=sk-your-key-here
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# Security
SECRET_KEY=your-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=sqlite:///./ca_assist.db
CHROMA_PATH=./chroma_db/
```

## Component Communication

### Props Flowing Down
```
App.tsx
├─ activeTab → Sidebar (highlight current)
├─ accessToken → Layout (show/hide logout button)
├─ onAuthClick → HomeScreen (trigger auth modal)
└─ isOpen, onClose → AuthModal (control modal visibility)
```

### State Updates (Zustand)
```
AuthModal
├─ Calls: setAccessToken(token)
└─ Triggers: store update → re-render components using accessToken

Sidebar
├─ Calls: setActiveTab(tab)
└─ Triggers: App re-renders with new activeTab

Components
└─ Calls: addMessage(message)
    └─ Triggers: chatHistory update → ChatScreen re-renders
```

### API Call Flow
```typescript
// 1. Component calls API function
const result = await queryAPI({ query: "...", user_id: userId })

// 2. Axios interceptor intercepts
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAppStore.getState()
  config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// 3. Request sent with auth header
// 4. Backend validates token
// 5. Response interceptor catches errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout() // Auto logout on unauthorized
    }
    return Promise.reject(error)
  }
)

// 6. Component updates UI with result
```

## Error Handling Strategy

### Frontend
```
Try/Catch in Components
├─ Try API call
├─ Catch error
├─ Set error state
└─ Display error message

Zustand Actions
├─ Handle logout on auth errors
├─ Clear sensitive data
└─ Redirect to home
```

### Backend
```
FastAPI Error Handling
├─ Pydantic validation (400)
├─ JWT verification (401)
├─ Permission checks (403)
├─ Engine business logic (400/500)
└─ Return JSON error response
```

## Performance Considerations

### Frontend
- ✅ Component memoization where needed
- ✅ Zustand for efficient state management
- ✅ Lazy loading not needed (SPA is small)
- ✅ Debounce input fields for large data

### Backend
- ✅ Database indexes on frequently queried fields
- ✅ Vector DB caching for RAG queries
- ✅ JWT token caching in middleware
- ✅ Async operations where possible

## Security Checklist

- ✅ JWT tokens signed with SECRET_KEY
- ✅ Passwords hashed with bcrypt
- ✅ CORS configured (currently open)
- ✅ Protected endpoints require authentication
- ✅ Tokens expire after 30 minutes
- ✅ SQL injection prevented by ORM
- ✅ XSS protection via React JSX

## Deployment Notes

### Frontend
- Build: `npm run build` → `dist/` folder
- Host on: Vercel, Netlify, or any static host
- Update `VITE_API_URL` to production API

### Backend
- Use production WSGI server: `gunicorn`
- Run on: DigitalOcean, AWS, Heroku, etc.
- Update `SECRET_KEY` and `DATABASE_URL`
- Use PostgreSQL instead of SQLite
- Set up HTTPS/SSL

---

**Last Updated:** 2024
**Integration Version:** 1.0.0 Complete

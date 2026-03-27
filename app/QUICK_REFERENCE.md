# CA-Assist Frontend - Quick Reference 📋

## 🚀 Quick Start

```bash
cd e:\frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 📁 File Locations

| What | Where |
|------|-------|
| Main app | `src/App.tsx` |
| Chat page | `src/pages/ChatPage.tsx` |
| Regime page | `src/pages/RegimeCalculatorPage.tsx` |
| Document page | `src/pages/DocumentUploadPage.tsx` |
| Navigation sidebar | `src/components/Sidebar.tsx` |
| Global state | `src/store/appStore.ts` |
| API calls | `src/lib/api.ts` |
| Utilities | `src/lib/utils.ts` |
| UI components | `src/components/ui/` |
| Styles | `src/index.css` |
| Config | `tailwind.config.ts` |
| Env variables | `.env` |

---

## 🎨 Design Colors (Tailwind)

```
bg-slate-950       # Background (dark)
bg-slate-900       # Cards/panels
bg-slate-800       # Inputs
bg-teal-600        # Primary button
text-slate-50      # Primary text
text-slate-400     # Secondary text
text-teal-400      # Highlights/citations
text-emerald-500   # Success
text-amber-400     # Warning
text-red-500       # Error
```

---

## 🔧 State Management

```typescript
// Import the store
import { useAppStore } from '@/store/appStore'

// Use in component
function MyComponent() {
  const { 
    activeTab, setActiveTab,
    chatHistory, addMessage,
    sessionId, isLoading, setIsLoading
  } = useAppStore()
}

// Add message to chat
addMessage({
  id: `msg-${Date.now()}`,
  role: 'user',
  content: 'Hello!',
  timestamp: new Date()
})
```

---

## 📡 API Calls

```typescript
// Import API functions
import { queryAPI, compareRegimeAPI, uploadDocumentAPI } from '@/lib/api'

// Chat query
const response = await queryAPI({
  query: 'What are Section 80C limits?',
  user_id: sessionId
})

// Tax calculation
const result = await compareRegimeAPI({
  gross_income: 5000000,
  sec_80c: 150000,
  sec_80d: 0,
  hra_exemption: 0
})

// Document upload
const analysis = await uploadDocumentAPI(file, sessionId)
```

---

## 🧩 UI Components

### Button
```jsx
<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>

// Variants: primary, secondary, ghost, destructive
// Sizes: sm, md, lg
```

### Card
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer here</CardFooter>
</Card>
```

### Input
```jsx
<Input 
  type="number"
  placeholder="Enter amount"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
/>
```

### Badge
```jsx
<Badge variant="citation">Section 80C</Badge>

// Variants: default, success, warning, destructive, citation
```

### Label
```jsx
<Label htmlFor="income">Gross Income</Label>
```

### Separator
```jsx
<Separator />  {/* Horizontal */}
<Separator orientation="vertical" />  {/* Vertical */}
```

---

## 💾 Utility Functions

```typescript
import { formatCurrency, formatTaxAmount, formatPercentage, formatDate, cn } from '@/lib/utils'

formatCurrency(500000)      // ₹500,000
formatTaxAmount(50000)      // ₹50,000
formatPercentage(15.5)      // 15.50%
formatDate(new Date())      // Formatted date/time
cn('class1', condition && 'class2')  // Merge classnames
```

---

## 🎯 Common Patterns

### Loading State
```typescript
const [isLoading, setIsLoading] = useState(false)

const handleClick = async () => {
  setIsLoading(true)
  try {
    const res = await fetchData()
    // Handle success
  } catch (err) {
    // Handle error
  } finally {
    setIsLoading(false)
  }
}

<Button isLoading={isLoading}>Submit</Button>
```

### Form with Validation
```typescript
const [input, setInput] = useState('')
const [error, setError] = useState<string | null>(null)

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!input.trim()) {
    setError('Field cannot be empty')
    return
  }
  setError(null)
  // Continue with submission
}

{error && <p className="text-red-500 text-sm">{error}</p>}
```

### Tab Navigation
```typescript
const { activeTab, setActiveTab } = useAppStore()

<button 
  onClick={() => setActiveTab('chat')}
  className={activeTab === 'chat' ? 'active' : ''}
>
  Chat
</button>
```

---

## 🎨 Custom Class Names

### Cards
```
.card-base        - Basic card style
.card-hover       - Card with hover effect
```

### Inputs
```
.input-base       - Styled input field
```

### Buttons
```
.btn-primary      - Primary button
.btn-secondary    - Secondary button
.btn-ghost        - Ghost button
```

### Text
```
.amount           - Currency display (teal, mono)
.citation-badge   - Citation badge style
.state-success    - Green text
.state-error      - Red text
.state-warning    - Amber text
```

---

## 📦 Build & Deploy

```bash
# Development
npm run dev              # http://localhost:5173

# Production
npm run build           # Creates dist/ folder
npm run preview         # Preview production build

# Deploy
# Vercel: vercel
# Netlify: netlify deploy --prod --dir=dist
# Docker: docker build -t app . && docker run -p 3000:3000 app
```

---

## 🔍 Environment Variables

```bash
# .env file
VITE_API_URL=http://localhost:8000

# For production
VITE_API_URL=https://api.ca-assist.com
```

---

## 🐛 Debugging Tips

```typescript
// Debug store state
import { useAppStore } from '@/store/appStore'
const store = useAppStore()
console.log(store)  // See all state

// Debug API response
try {
  const res = await queryAPI(...)
  console.log('Response:', res)
} catch (err) {
  console.error('Error:', err)
}

// React DevTools browser extension recommended
// (Chrome/Firefox)
```

---

## ⚡ Performance Tips

```typescript
// Memoize expensive components
import { memo } from 'react'
export default memo(MyComponent)

// Lazy load pages
const ChatPage = lazy(() => import('./pages/ChatPage'))

// Debounce search inputs
const debounceSearch = debounce((value) => {
  // API call
}, 500)

// Use virtual scroll for long lists
// Import from react-window or @tanstack/react-virtual
```

---

## 📚 Useful Imports

```typescript
// State
import { useAppStore } from '@/store/appStore'
import { useState, useEffect, useRef } from 'react'

// API
import { queryAPI, compareRegimeAPI, uploadDocumentAPI } from '@/lib/api'

// Components
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Label, Badge } from '@/components/ui/Badge'
import Separator from '@/components/ui/Separator'

// Icons
import { Send, Upload, TrendingUp, CheckCircle } from 'lucide-react'

// Utilities
import { cn, formatCurrency, formatDate } from '@/lib/utils'
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| API fails to connect | Check `VITE_API_URL` in `.env`, ensure backend running |
| Styles not applying | Restart dev server, check Tailwind config |
| Page not updating | Check store is initialized, verify state is updated |
| Types error | Run `npm install`, check tsconfig.json |

---

## 📞 Support Files

- `README.md` - Overview & quick start
- `SETUP_GUIDE.md` - Detailed installation guide
- `IMPLEMENTATION_SUMMARY.md` - What's been built
- `QUICK_REFERENCE.md` - This file!

---

**Keep this file handy while developing! 📋**

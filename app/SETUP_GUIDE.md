# CA-Assist Frontend Setup Guide

## 📋 Table of Contents
1. [Installation](#installation)
2. [Project Structure](#project-structure)
3. [Key Features](#key-features)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Styling System](#styling-system)
7. [Running the App](#running-the-app)
8. [Deployment](#deployment)

---

## 🔧 Installation

### Step 1: Prerequisites
Ensure you have Node.js 16+ installed:
```bash
node --version  # Should be v16.0.0 or higher
npm --version   # Should be v7.0.0 or higher
```

### Step 2: Install Dependencies
```bash
cd e:\frontend
npm install
```

This installs:
- **React 18** - UI library
- **Vite** - Build tool (lightning fast)
- **Tailwind CSS** - Utility CSS framework
- **shadcn/ui patterns** - Component patterns
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons

### Step 3: Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env to point to your backend
# VITE_API_URL=http://localhost:8000
```

### Step 4: Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173`

---

## 🎯 Project Structure

```
e:\frontend\
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx              # Left sidebar navigation
│   │   └── ui/                      # shadcn/ui components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       └── Separator.tsx
│   │
│   ├── pages/
│   │   ├── ChatPage.tsx             # Chat interface
│   │   ├── RegimeCalculatorPage.tsx # Tax regime comparison
│   │   └── DocumentUploadPage.tsx   # Document analysis
│   │
│   ├── store/
│   │   └── appStore.ts              # Zustand store
│   │
│   ├── lib/
│   │   ├── api.ts                   # API client
│   │   └── utils.ts                 # Helper functions
│   │
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # Vite entry point
│   └── index.css                    # Global styles
│
├── public/
│   └── logo.svg                     # Logo (optional)
├── index.html
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## ✨ Key Features

### 1. Chat Interface
**File**: `src/pages/ChatPage.tsx`

- Real-time conversation with tax assistant
- Message history with timestamps
- Citation display from documents
- Streaming loader animation
- Auto-scroll to latest messages

**Supported Query Types**:
- TAX_QUERY: "What are Section 80C limits?"
- GST_QUERY: "What's the GST rate on items?"
- ADVISORY: "Tax saving recommendations"

### 2. Tax Regime Calculator
**File**: `src/pages/RegimeCalculatorPage.tsx`

- Compare Old vs. New income tax regimes
- Input fields with validation
- Side-by-side results display
- Tax slab breakdown visualization
- Automatic recommendation with savings

**Inputs**:
- Gross income (required)
- Section 80C deductions (up to ₹1,50,000)
- Section 80D deductions (health insurance)
- HRA exemption

**Outputs**:
- Taxable income
- Tax slabs & rates
- Base tax + cess calculation
- Rebates applied
- Total tax payable
- **Verdict**: Recommended regime with savings

### 3. Document Upload
**File**: `src/pages/DocumentUploadPage.tsx`

- File upload (PDF, PNG, JPG)
- Max 10MB file size
- AI document analysis
- Extracted information display
- Citation references

**Supported Docs**:
- Form 16 (salary income)
- Invoices & receipts
- Investment certificates
- Bank statements
- Medical bills

---

## 🏗️ Component Architecture

### Page Structure
```
App.tsx (Main Layout)
├── Sidebar (Navigation)
│   └── useAppStore (Global State)
│
└── Main Content Area
    ├── ChatPage (Active if activeTab === 'chat')
    ├── RegimeCalculatorPage (Active if activeTab === 'regime')
    └── DocumentUploadPage (Active if activeTab === 'document')
```

### Component Reusability

All UI components follow shadcn/ui patterns:

```typescript
// Button component
<Button 
  variant="primary" 
  size="md" 
  isLoading={loading}
>
  Calculate
</Button>

// Card component
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>

// Input component
<Input 
  placeholder="Enter value"
  type="number"
  disabled={false}
/>

// Badge component
<Badge variant="citation">Section 80C</Badge>
```

---

## 💾 State Management (Zustand)

### Global Store
**File**: `src/store/appStore.ts`

```typescript
interface AppStore {
  activeTab: 'chat' | 'regime' | 'document'
  chatHistory: Message[]
  sessionId: string
  isLoading: boolean
}
```

### Usage Example

```typescript
import { useAppStore } from '@/store/appStore'

function MyComponent() {
  const { activeTab, setActiveTab, chatHistory, addMessage } = useAppStore()
  
  // Component logic
}
```

### Key Methods

| Method | Purpose |
|--------|---------|
| `setActiveTab(tab)` | Switch between pages |
| `addMessage(message)` | Add message to chat history |
| `clearChat()` | Clear chat history |
| `initSession()` | Generate unique session ID |
| `setIsLoading(bool)` | Set loading state |

---

## 🎨 Styling System

### Design Tokens (Tailwind)

**Colors**:
```css
Primary:     bg-teal-600    (#0D9488)
Primary Dark: bg-teal-700   (#0F766E)
Background:   bg-slate-950  (#020617)
Surface:      bg-slate-900  (#0F172A)
Border:       border-slate-700
Text Primary: text-slate-50
Text Secondary: text-slate-400
Success:      text-emerald-500
Warning:      text-amber-400
Error:        text-red-500
Citation:     text-teal-400
```

**Typography**:
```css
Font Family: 'DM Sans' (body), 'DM Mono' (numbers)
Heading: font-semibold tracking-tight
Body: text-sm leading-relaxed
Mono: font-mono (for amounts, slabs)
```

### Custom Classes (in `index.css`)

```css
.card-base        /* Default card styling */
.card-hover       /* With hover effect */
.input-base       /* Styled input */
.btn-primary      /* Primary button */
.btn-secondary    /* Secondary button */
.btn-ghost        /* Ghost button */
.amount           /* Currency display */
.citation-badge   /* Citation styling */
.state-success    /* Success color */
.state-error      /* Error color */
.state-warning    /* Warning color */
.animate-slow-pulse /* Slow pulse animation */
```

### Example: Building a Custom Component

```typescript
import { cn } from '@/lib/utils'

function MyCard({ className, children }) {
  return (
    <div className={cn('card-base hover:border-teal-600', className)}>
      {children}
    </div>
  )
}
```

---

## ▶️ Running the App

### Development Mode
```bash
npm run dev           # Start Vite dev server
```
- Hot module replacement (HMR)
- Open at `http://localhost:5173`
- Watch files for changes

### Production Build
```bash
npm run build         # Build to dist/
npm run preview       # Preview production build
```

### Lint (Optional)
```bash
npm run lint         # Check for issues
```

---

## 🚀 Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_API_URL=https://api.ca-assist.com
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Configure in netlify.toml:
# [build]
# command = "npm run build"
# publish = "dist"
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
docker build -t ca-assist-frontend .
docker run -p 3000:3000 ca-assist-frontend
```

---

## 💡 Tips & Best Practices

### 1. Add New Features
When adding a new page:
1. Create `src/pages/NewPage.tsx`
2. Add to `App.tsx` conditional rendering
3. Add navigation item to `Sidebar.tsx`
4. Add store state if needed

### 2. API Integration
For new API calls:
1. Add function to `src/lib/api.ts`
2. Import in component
3. Handle loading/error states
4. Display results in UI

### 3. Styling
- Use Tailwind classes first
- Custom classes in `index.css` for repeated patterns
- Variables in `tailwind.config.ts` for design tokens
- Use `cn()` utility for conditional classes

### 4. Performance
- Lazy load pages with React.lazy()
- Memoize expensive components with React.memo()
- Debounce API calls in search inputs
- Use virtual scrolling for long lists

---

## 🐛 Common Issues

### Issue: API Connection Failed
**Solution**: 
- Check backend is running: `http://localhost:8000/health`
- Verify `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### Issue: Styles Not Applying
**Solution**:
- Ensure Tailwind is building: `npm run dev`
- Check className is correct
- Clear cache: `rm -rf node_modules/.cache`

### Issue: Hot reload not working
**Solution**:
- Restart dev server: `npm run dev`
- Check file is in `src/` directory
- Verify vite.config.ts is correct

---

## 📚 Additional Resources

- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com)
- [Zustand Docs](https://zustand-demo.vercel.app)
- [Lucide Icons](https://lucide.dev)

---

**Happy Building! 🎉**

For questions or issues, check the `README.md` or contact the team.

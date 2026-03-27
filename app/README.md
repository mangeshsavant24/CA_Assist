# CA-Assist Frontend

A modern React + Tailwind CSS + shadcn/ui frontend for the CA-Assist tax and compliance assistant application.

## 🎨 Design System

### Colors
- **Primary**: Teal (#0D9488)
- **Primary Dark**: Teal-700 (#0F766E)
- **Background**: Slate-950 (#020617) - Dark theme
- **Surface**: Slate-900 (#0F172A) - Cards and panels
- **Text Primary**: Slate-50
- **Text Secondary**: Slate-400
- **Success**: Emerald-500
- **Warning**: Amber-400

### Typography
- **Font Family**: DM Sans (body), DM Mono (numbers/code)
- **Headings**: font-semibold, tracking-tight
- **Body**: text-sm, leading-relaxed
- **Currency**: Font mono, Teal-400

## ✨ Features

### Three Main Sections

1. **Chat Interface** (`/chat`)
   - Real-time chat with tax assistant
   - Support for TAX_QUERY, GST_QUERY, ADVISORY questions
   - Display of citations and sources
   - Message history with timestamps

2. **Tax Regime Calculator** (`/regime`)
   - Compare old vs. new income tax regimes
   - Input fields for:
     - Gross income
     - Section 80C deductions (max ₹1,50,000)
     - Section 80D deductions (health insurance)
     - HRA exemption
   - Results showing:
     - Side-by-side regime comparison
     - Tax slab breakdowns
     - Calculated tax with cess and rebates
     - Money-saving recommendation

3. **Document Upload** (`/document`)
   - Upload PDF/image documents (PNG, JPG)
   - AI analysis of documents
   - Extracted information display
   - Citation references

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Connect to Backend

Edit `.env` to point to your backend:
```env
VITE_API_URL=http://localhost:8000
```

## 📦 Project Structure

```
src/
├── components/
│   ├── Sidebar.tsx          # Navigation sidebar
│   └── ui/                  # shadcn/ui components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       └── Separator.tsx
├── pages/
│   ├── ChatPage.tsx         # Chat interface
│   ├── RegimeCalculatorPage.tsx
│   └── DocumentUploadPage.tsx
├── store/
│   └── appStore.ts          # Zustand global state
├── lib/
│   ├── api.ts               # API client (axios)
│   └── utils.ts             # Utility functions
├── App.tsx
├── main.tsx
└── index.css                # Global styles & Tailwind

index.html                    # Entry point
package.json
tailwind.config.ts
vite.config.ts
```

## 🎯 State Management (Zustand)

### Global Store (`useAppStore`)

```typescript
{
  activeTab: 'chat' | 'regime' | 'document'
  chatHistory: Message[]
  sessionId: string
  isLoading: boolean
}
```

## 📡 API Integration

All API calls are wrapped in `src/lib/api.ts`:

- `queryAPI(query, userId)` - Chat queries
- `compareRegimeAPI(input)` - Regime comparison
- `uploadDocumentAPI(file, userId)` - Document uploads
- `getHealthAPI()` - Health check endpoint

## 🎨 Component Library

### Custom UI Components (shadcn/ui style)

- `Button` - Variants: primary, secondary, ghost, destructive
- `Card` - With CardHeader, CardTitle, CardContent, CardFooter
- `Input` - Styled with focus states
- `Label` - For form labels
- `Badge` - Variants: default, success, warning, destructive, citation
- `Separator` - Horizontal and vertical

### Custom Utilities

- `formatCurrency(amount)` - ₹X,XX,XXX format
- `formatTaxAmount(amount)` - Monetary display
- `formatPercentage(value)` - Percentage formatting
- `formatDate(date)` - Date/time formatting
- `cn(...classes)` - Tailwind class merging

## 🔧 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Output is in `dist/` folder.

### Deployment Options

1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Docker**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "run", "preview"]
   ```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

## 🎓 Styling Notes

### Custom Classes

All components use custom Tailwind classes defined in `index.css`:

```css
.card-base         /* Card styling */
.input-base        /* Input styling */
.btn-primary       /* Primary button */
.amount            /* Currency display */
.citation-badge    /* Citation styling */
.state-success     /* Success state */
.state-error       /* Error state */
```

### Responsive Design

The app is mobile-responsive with:
- Sidebar collapses on small screens
- Cards stack vertically
- Touch-friendly button sizes

## 🐛 Troubleshooting

### API Connection Issues
- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### Styling Issues
- Tailwind cache: `rm -rf .next node_modules/.cache`
- Rebuild: `npm run build`

### State Not Persisting
- Check if session initialization happens in `useEffect`
- Verify Zustand store in DevTools

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.vercel.app/)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contributing

Pull requests are welcome! Please ensure:
- Components follow shadcn/ui patterns
- Tailwind classes are used consistently
- Types are properly defined
- The design system is maintained

## 📄 License

MIT

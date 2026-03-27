# CA-Assist: AI-Powered Virtual Chartered Accountant

An intelligent, production-ready tax assistant built with FastAPI, LangChain, React, and ChromaDB. Provides deterministic tax calculations, RAG-backed Q&A, and document analysis for Indian taxation.

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![React](https://img.shields.io/badge/React-18.2+-cyan)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

### Backend (FastAPI + LangChain)
- ✅ **Tax Regime Comparison**: Deterministic old vs. new regime calculations with Section 87A rebates
- ✅ **Intelligent Q&A**: Intent classification with agent-based routing (Tax, GST, Advisory agents)
- ✅ **RAG System**: Vector-based semantic search with Chroma DB and Sentence Transformers
- ✅ **Document Analysis**: PDF/Image extraction and financial data parsing
- ✅ **Citation Management**: Automated extraction and formatting of tax act references
- ✅ **Pluggable LLM**: Support for Ollama (local) and OpenAI (cloud)

### Frontend (React + Tailwind + shadcn/ui)
- ✅ **Chat Interface**: Real-time conversation with agent badges and citations
- ✅ **Regime Calculator**: Two-panel sticky calculator with side-by-side comparison
- ✅ **Document Upload**: Drag-drop interface with real-time extraction and insights
- ✅ **Design System**: Dark theme (Slate-950), Teal primary, DM Sans typography
- ✅ **Responsive**: Mobile-friendly with smooth animations

## 📁 Project Structure

```
ca_assist/
├── backend/                    # Python FastAPI backend
│   ├── agents/                 # Specialized agents (Tax, GST, Advisory, etc.)
│   ├── api/                    # FastAPI routes (/query, /regime, /document)
│   ├── engines/                # Tax calculation & citation extraction
│   ├── rag/                    # RAG system (embeddings, retrieval, ingestion)
│   ├── Knowledge_base/         # Source PDFs (Income Tax Act, Rules, etc.)
│   ├── chroma_db/              # Vector database storage
│   ├── tests/                  # Pytest test suite (7/7 passing)
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   └── README.md               # Backend docs
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # React components (ChatScreen, RegimeCalculator, etc.)
│   │   ├── pages/              # Page components (fallback)
│   │   ├── lib/                # Utilities (API client, formatters)
│   │   ├── store/              # Zustand state management
│   │   ├── App.tsx             # Main router
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── index.html              # HTML shell
│   ├── package.json            # Node dependencies
│   ├── vite.config.ts          # Vite build config
│   ├── tailwind.config.ts      # Tailwind customization
│   ├── tsconfig.json           # TypeScript config
│   ├── .env.example            # Environment template
│   └── README.md               # Frontend docs
│
├── .gitignore                  # Git exclusions
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Ollama (for local LLM) OR OpenAI API key

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd ca_assist
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set LLM_PROVIDER and other settings
   ```

3. **Start the API server:**
   ```bash
   uvicorn api.main:app --reload
   # API available at http://localhost:8000
   # Docs at http://localhost:8000/docs
   ```

### Frontend Setup

1. **Install Node dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Optional: update VITE_API_URL if backend is on different host
   ```

3. **Start development server:**
   ```bash
   npm run dev
   # Available at http://localhost:5173
   ```

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/query` | Tax/GST questions with RAG-backed citations |
| POST | `/regime/compare` | Tax regime comparison (old vs new) |
| POST | `/document/upload` | Document analysis (PDF/Image) |
| GET | `/health` | Health check with RAG metadata |

**Example: Tax Query**
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Section 80C limit?", "user_id": "user123"}'
```

## 🏗️ Architecture

### Backend Flow
```
User Query
    ↓
Orchestrator (Intent Classification)
    ├─ TAX_QUERY → Tax Agent (RAG + LLM)
    ├─ GST_QUERY → GST Agent (RAG + LLM)
    ├─ ADVISORY → Advisory Agent (Strategy + RAG)
    └─ DOCUMENT_UPLOAD → Document Agent (Extraction)
    ↓
RAG Retriever (Chroma DB Vector Search)
    ↓
LLM (Ollama or OpenAI)
    ↓
Citation Engine (Format & Extract References)
    ↓
CitedResponse (Answer + Citations)
```

### Frontend Flow
```
React App (Zustand State)
    ├─ ChatScreen (Agent badges + citations)
    ├─ RegimeCalculator (Sticky inputs + results)
    └─ DocumentUpload (Drag-drop + insights)
         ↓
    API Client (Axios)
         ↓
    Backend API (FastAPI)
         ↓
    Response (JSON)
         ↓
    Component Update (Animations + Display)
```

## 🧪 Testing

**Run backend tests:**
```bash
cd ca_assist
pytest tests/ -v
# Expected: 7/7 passing
```

**Backend test coverage:**
- ✅ Tax slabs for all income levels (0-₹15L+)
- ✅ Section 87A rebate calculation
- ✅ Multi-slab tax aggregation
- ✅ Citation extraction and formatting

## 📦 Dependencies

### Backend
- **Framework**: FastAPI 0.104+
- **LLM**: LangChain 0.2+, langchain-ollama 0.2.1
- **Vector DB**: Chroma 0.4+
- **Embeddings**: sentence-transformers 2.2+
- **Document Processing**: PyPDF2, pytesseract
- **Validation**: Pydantic 2.0+

### Frontend
- **Framework**: React 18.2+
- **Build Tool**: Vite 5.0+
- **Styling**: Tailwind CSS 3.3+
- **UI Library**: shadcn/ui (component patterns)
- **State**: Zustand 4.4+
- **HTTP**: Axios 1.6+
- **Icons**: Lucide React 0.292+
- **Type Safety**: TypeScript 5.2+

## 🎨 Design System

- **Color Palette**: Slate-950 (dark), Teal-600 (primary), custom emerald/amber for decisions
- **Typography**: DM Sans (body), DM Mono (numbers/code)
- **Components**: 5 reusable UI components + 3 feature components
- **Animations**: Smooth transitions, pulse dots, slide-in results

## 📝 Environment Variables

### Backend (.env)
```
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
# OR
# OPENAI_API_KEY=sk-...
# LLM_PROVIDER=openai
SESSION_TIMEOUT=3600
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## 🛠️ Development

**Backend development:**
```bash
cd ca_assist
# Install dev dependencies
pip install pytest black mypy

# Format code
black .

# Type check
mypy agents engines rag

# Run tests
pytest tests/ -v --cov
```

**Frontend development:**
```bash
cd frontend
# Type check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📜 Documentation

- [Backend README](ca_assist/README.md) - Detailed backend setup and architecture
- [Frontend README](frontend/README.md) - Frontend quick start and features
- [System Analysis](ca_assist/COMPREHENSIVE_SYSTEM_ANALYSIS.md) - Complete system breakdown
- [Components Guide](frontend/COMPONENTS_BUILD_GUIDE.md) - React component specifications

## 🚢 Deployment

### Backend
```bash
# Production-grade startup
gunicorn api.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker

# OR with Docker
docker build -t ca-assist-backend .
docker run -p 8000:8000 ca-assist-backend
```

### Frontend
```bash
# Build for production
npm run build

# Deploy to Vercel / Netlify
# dist/ folder contains static assets
```

## 📊 Test Results

```
tests/test_regime_engine.py ......... 6 PASSED ✓
tests/test_citation_engine.py ....... 1 PASSED ✓

Total: 7/7 PASSED ✓
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Important Notes

- **LLM Models**: Mistral 7B is recommended (4.3GB). Ensure you have adequate disk space.
- **API Keys**: Never commit `.env` files with real secrets. Use `.env.example` as template.
- **Chroma DB**: Vector database persists in `chroma_db/`. First run will build embeddings (~2-5 minutes).
- **CORS**: Backend allows requests from localhost:5173 and localhost:3000 by default.

## 📞 Support

For issues, questions, or suggestions:
1. Check documentation in respective README files
2. Review test files for usage examples
3. Check `.env.example` for configuration options

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

**Built with ❤️ for Indian tax professionals**

# 🚀 CA_Assist Fixes Setup & Testing Guide

## Quick Start (5 minutes)

### Step 1: Install New Backend Dependencies
```bash
cd server/ca_assist

# Install new packages (langchain-openai, requests)
pip install -r requirements.txt

# Or if you're using a venv/conda:
# source .venv/bin/activate  (Linux/Mac)
# .venv\Scripts\activate     (Windows)
# Then: pip install -r requirements.txt
```

### Step 2: Setup Ollama (if using local LLM)
```bash
# Option A: If Ollama already installed, just ensure a model is loaded
ollama serve  # Start Ollama server (keep running)

# In another terminal, load a model:
ollama pull llama2    # ~7GB, recommended
# OR
ollama pull mistral   # ~4.1GB, faster but less accurate
# OR use your existing model

# Verify models are installed:
curl http://localhost:11434/api/tags
```

### Step 3: Update .env (Already Updated ✅)
The `.env` file has been updated with:
- Default model changed from "mistral" to "llama2"
- New LLM configuration options documented
- OpenAI as fallback provider option

**Current configuration:**
```
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama2
OLLAMA_BASE_URL=http://localhost:11434
```

### Step 4: Run Verification Test
```bash
cd server/ca_assist

# Run the test script to verify all fixes
python test_fixes.py

# Expected output:
# ✅ All tests passed! Ready to start server.
```

### Step 5: Start Backend Server
```bash
cd server/ca_assist

# Start with reload enabled for development
uvicorn api.main:app --reload

# You should see:
# INFO: Uvicorn running on http://127.0.0.1:8000
# Using Ollama LLM: llama2 at http://localhost:11434
```

### Step 6: Start Frontend (in new terminal)
```bash
cd app

# Install dependencies (if first time)
npm install

# Start dev server
npm run dev

# Open http://localhost:5173 in browser
```

---

## Testing The Fixes

### Test 1: Verify Ollama Connection ✅
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Test connection
curl http://localhost:11434/api/tags

# Expected response:
# {"models":[{"name":"llama2:latest",...}]}
```

### Test 2: Backend Validation Test ✅
```bash
cd server/ca_assist
python test_fixes.py

# Should output ✅ for all tests:
# ✅ Imports
# ✅ Environment
# ✅ LLM Providers
# ✅ Schemas
# ✅ DocumentAgent
```

### Test 3: Document Upload (Payslip) ✅

**Using the UI:**
1. Go to http://localhost:5173
2. Click "Document Upload" tab
3. Upload a salary slip PDF
4. Wait for extraction (30-60 seconds first time, shorter after)
5. You should see:
   - ✅ Document type badge: "📄 Salary Slip Detected"
   - ✅ Extracted fields: gross_salary, tds_deducted, pf, pan
   - ✅ **GREEN button**: "Use these values in Regime Calculator →"

**Expected extracted data:**
```json
{
  "gross_salary": 900000,
  "tds_deducted": 15000,
  "pf": 50000,
  "pan": "ABCDE1234F",
  "gstin": null,
  "document_type": "salary_slip",
  "is_relevant_for_regime": true,
  "relevance_reason": null
}
```

### Test 4: Document Upload (Invoice) ✅

**Using the UI:**
1. Upload an invoice PDF
2. You should see:
   - ✅ Document type badge: "🧾 Invoice Detected"
   - ✅ **GREYED button** with tooltip:
     - "This invoice is not applicable for regime calculations. Please upload a salary slip or Form 16."

### Test 5: Regime Calculator Integration ✅

**After uploading a payslip:**
1. Click "Use in Regime Calculator →" button
2. Should auto-navigate to Regime tab
3. Form should be pre-filled with:
   - Gross Income: (from gross_salary)
   - Section 80C: (from pf)
   - Other Deductions: (from tds_deducted)
4. Modify values if needed
5. Click "Calculate & Compare"
6. ✅ Should show both regimes and recommendation

### Test 6: Multi-Document Flow ✅

1. Upload multiple documents (payslip, form16, invoice)
2. For payslip/form16: Import button enabled ✅
3. For invoice: Import button disabled ❌
4. Each document should be listed in history
5. Can delete documents from history

---

## Troubleshooting

### Issue 1: "model 'llama2' not found"
```bash
# Solution: Install the model
ollama pull llama2

# Then restart Ollama server
ollama serve
```

### Issue 2: "Cannot connect to Ollama"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If connection refused:
ollama serve  # Start Ollama (keep terminal open)
```

### Issue 3: Document upload hangs or times out
```bash
# Could be:
1. First-time model load (takes 30-60 seconds)
2. Large document (try smaller file first)
3. OCR processing for images (tesseract might be slow)

# Check server logs for specific error
# Usually shows "Error parsing document with LLM: ..."
```

### Issue 4: Extract values not showing in form
**Check:**
1. Verify API response includes extracted_data (not null)
2. Open DevTools Console for errors
3. Check Network tab → POST /document/upload response
4. Verify document_type is "salary_slip" (not "invoice")
5. Verify is_relevant_for_regime is true

**Debug in browser console:**
```javascript
// After uploading, check stored data:
localStorage.getItem('_appStore')  // Should include documentExtractedData
```

### Issue 5: "OpenAI API key not configured"
```bash
# Solution: Either
A) Don't use OpenAI (default is Ollama which is free, local)
B) Get API key from https://platform.openai.com
C) Set in .env: OPENAI_API_KEY=sk-your-actual-key
```

### Issue 6: Tesseract OCR not found (for images)
```bash
# Windows:
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Install and set path in environment variables

# Linux:
sudo apt-get install tesseract-ocr

# macOS:
brew install tesseract
```

---

## Environment Configuration

### Option A: Ollama (Recommended - Free, Local) ✅
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2         # Change to: mistral, neural-chat, etc.
OPENAI_API_KEY=sk-yourapikey  # Can leave as placeholder
```

### Option B: OpenAI (Requires API Key)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4, gpt-4-turbo-preview
OLLAMA_MODEL=llama2          # Can leave unchanged
```

### Option C: Automatic Fallback (Best for Reliability)
```env
LLM_PROVIDER=ollama              # Try Ollama first
# If Ollama fails, automatically falls back to OpenAI
OPENAI_API_KEY=sk-your-actual-key-here  # For fallback
```

---

## What Each Fix Does

### Fix 1: LLM Provider Switching ✨
- **Before:** Would crash if 'mistral' model not found
- **After:** Auto-detects available models, falls back to OpenAI if needed
- **Benefit:** More robust, works with any local model you have

### Fix 2: Content-Based Document Classification ✨
- **Before:** Only checked filename (fragile, often wrong)
- **After:** Analyzes content for type (accurate) + LLM confirmation (when uncertain)
- **Benefit:** Correctly identifies salary slips even with generic filenames

### Fix 3: Document Relevance Detection ✨
- **Before:** All documents treated same way, import button always enabled
- **After:** Checks if document can be used for regime calculations
- **Benefit:** User knows why import is disabled + can't accidentally use wrong doc types

---

## Performance Notes

### First Time:
- Document upload: 30-60 seconds (model loads into memory)
- All subsequent: 10-20 seconds (model cached)

### Ways to Speed Up:
1. Use smaller/faster model (mistral instead of llama2)
2. Use OpenAI (instant but costs money)
3. Use smaller PDF files
4. For images: Higher resolution = faster OCR

---

## File Changes Summary

| File | Changes | Impact |
|------|---------|--------|
| `agents/__init__.py` | LLM provider switching + validation | Robustness |
| `agents/document_agent.py` | Content classification + relevance | Accuracy |
| `api/document_schemas.py` | New fields (is_relevant_for_regime, etc) | API response |
| `api/routes/document.py` | Updated response handling | Backend |
| `.env` | Better config + model changed to llama2 | Setup |
| `DocumentUpload.tsx` | Conditional button + relevance display | Frontend |
| `requirements.txt` | Added langchain-openai, requests | Dependencies |

---

## Next Steps After Verification

1. ✅ Run test_fixes.py - verify all imports work
2. ✅ Start Ollama and verify model loaded
3. ✅ Start backend server
4. ✅ Start frontend
5. ✅ Upload test documents (payslip, invoice)
6. ✅ Verify button enabled/disabled correctly
7. ✅ Click import button and test regime calculation
8. ✅ Done! 🎉

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Check server logs (terminal where uvicorn is running)
3. Check browser console (F12 → Console tab)
4. Check Network tab for API response
5. Verify Ollama is running and has a model loaded

Good luck! 🚀

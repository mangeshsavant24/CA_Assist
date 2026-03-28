# Document Upload — Complete Fix & Debugging Guide

## ✅ All Critical Fixes Implemented

### 1. **Global Error Boundary** (`app/src/components/ErrorBoundary.tsx`)
- Catches React component crashes
- Displays error messages instead of blank screen
- Allows safe reloading

### 2. **Enhanced Logging** 
- **Frontend**: `DocumentUpload.tsx` logs every step of upload flow
- **Backend**: `api/routes/document.py` logs extraction results
- **API Client**: `lib/api.ts` logs request/response lifecycle

### 3. **Defensive Response Parsing**
- Type checks before accessing nested fields
- Fallback defaults for all optional properties
- Stack traces in error messages

### 4. **Standardized JSON Responses**
- Success: `{ success: true, document, ingest_result, extracted_data, ... }`
- Error (400): Unsupported file type with clear message
- Error (500): All exceptions return JSON, never HTML

### 5. **File Type Validation**
- Supported: `.pdf`, `.png`, `.jpg`, `.jpeg`
- Rejects others with HTTP 400 + error message
- Both frontend and backend validation

---

## 🧪 How to Debug the Blank Screen Issue

### Step 1: Open DevTools
Press `F12` in browser → Go to **Console** tab

### Step 2: Upload a Document
1. Click "Extract & Analyze"
2. Watch the console for messages

### Step 3: Look for These Logs

**If working:**
```
Using default backend URL: http://127.0.0.1:8000
[uploadDocumentAPI] Sending file: WhatsApp Image 2026-03-28.jpeg size: 61440
Upload response: {success: true, document: {...}, ...}
Response type: object
Response keys: ['success', 'message', 'document', ...]
Response.success: true
docInfo: {...}
ingestInfo: {...}
backendExtractedData: {...}
```

**If error:**
```
[ErrorBoundary] Caught error: <error message>
=== UPLOAD ERROR ===
Error object: <error details>
Error message: <human-readable message>
Error stack: <stack trace>
```

### Step 4: Check Network Tab
1. Open DevTools → **Network** tab
2. Click extract & analyze
3. Look for `/document/upload` request
4. Click it → **Response** tab
5. Is it JSON or HTML? (if HTML with `<`, that's the problem)

---

## 🔧 Common Issues & Solutions

### Issue A: Blank Screen with No Error

**Likely cause:** Backend is still running old code or crashed
**Solution:**
1. Stop backend (Ctrl+C in uvicorn terminal)
2. Restart backend: `uvicorn ca_assist.api.main:app --reload`
3. Verify: `curl http://127.0.0.1:8000/health`
4. Try upload again

### Issue B: Error Response Has HTML

**Likely cause:** Exception escaped error handler
**Solution:**
- Check backend terminal for traceback
- Error handlers should catch all exceptions now
- If still HTML, there's an unhandled case

### Issue C: Status 200 but `success: false`

**Likely cause:** Document processing failed (Tesseract missing, file corrupted, etc.)
**Check error field:**
- Look at `response.error` in console
- Related to OCR? Need to install Tesseract

### Issue D: TypeError: Cannot read property 'xxx' of undefined

**Likely cause:** Response structure mismatch
**Solution:**
- All field access now has defensive checks
- Fallback defaults are provided
- Should not happen anymore

---

## 🚀 Quick Manual Test

To verify backend JSON response without UI:

```bash
cd D:\Hackathon\CA_Assist

# 1. Get an auth token (first create a user, then login)
# From browser: login and copy token from localStorage['accessToken']

# 2. Run test script
python test_document_upload.py "<your_token>" "path/to/image.jpg"
```

Expected output:
```
✅ Response is valid JSON:
{
  "success": true,
  "message": "Document uploaded and processed successfully.",
  "document": {...},
  "ingest_result": {...},
  "extracted_data": {...}
}
```

---

## 📊 Files Changed

| File | Changes | Purpose |
|------|---------|---------|
| `app/src/components/ErrorBoundary.tsx` | **NEW** | Catch React errors, display friendly UI |
| `app/src/App.tsx` | Wrapped with `<ErrorBoundary>` | Enable error recovery |
| `app/src/lib/api.ts` | Enhanced logging | Track request/response lifecycle |
| `app/src/components/DocumentUpload.tsx` | Extensive logging + defensive checks | Log every parsing step with fallbacks |
| `server/ca_assist/api/main.py` | Global exception handlers | Guarantee JSON errors |
| `server/ca_assist/api/routes/document.py` | Server-side logging | Log extraction steps |

---

## ✅ Verification Checklist

- [x] Frontend builds without TypeScript errors
- [x] Backend has global exception handlers returning JSON
- [x] File type validation on upload
- [x] Defensive response parsing with fallbacks
- [x] Error boundary catches React crashes
- [x] Comprehensive logging at every step
- [ ] Upload JPEG file and confirm success in console
- [ ] Error messages are clear and actionable
- [ ] No blank screen on failure
- [ ] Network tab shows JSON (not HTML)

---

## Next Step

**Try uploading a JPEG now.**

Watch the browser console (F12) and share:
1. Any error messages shown
2. Whether screen remains visible (not blank)
3. Network response (is it JSON or HTML?)
4. Backend terminal output

With this info, any remaining issue can be fixed immediately.

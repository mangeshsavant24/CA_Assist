# Document Upload Fix — Diagnostic Steps

## Issue Status
✅ **All code fixes implemented and compiled successfully**
- Backend: JSON error handlers added
- Frontend: Response parsing & logging enhanced
- File type validation for JPEG/PDF

## Blank Screen Issue — Diagnosis Needed

When you click "Extract & Analyze", the screen goes blank. This indicates a JavaScript error.
Your browser is likely throwing an error that's crashing the component.

### Step 1: Get the Actual Error (CRITICAL)

1. **Open Browser Developer Tools:**
   - Press `F12` (Windows) or `Cmd+Option+I` (Mac)

2. **Click the Console Tab**

3. **Reproduce the issue:**
   - Click "Extract & Analyze" on a JPEG/PDF file

4. **Share the error message(s) that appear in the console**
   - Look for red error lines
   - Copy the full stack trace
   - This will show exactly what's failing

### Step 2: Check the Backend Logs

When you click upload, the backend should show:
```
[DOCUMENT] Extraction result: {...}
```

If you don't see this, the request might not be reaching the backend.

### Step 3: Verify Backend is Running

```
http://127.0.0.1:8000/health
```

Should return JSON with status "ok"

---

## What I Fixed:

### ✅ FIX 1: Global JSON Exception Handlers
File: `server/ca_assist/api/main.py`
- Added RequestValidationError → JSON
- Added generic Exception → JSON
- All errors now return JSON, never HTML

### ✅ FIX 2: JPEG/Image File Validation  
File: `server/ca_assist/api/routes/document.py`
- Validates file extensions on upload
- Returns 400 with clear error for unsupported types
- Supported: PDF, PNG, JPG, JPEG

### ✅ FIX 3: Fixed API URL (127.0.0.1:8000)
File: `app/src/lib/api.ts`
- Changed from dynamic hostname to fixed `http://127.0.0.1:8000`
- Removed manual multipart/form-data header (Axios auto-detects boundary)

### ✅ FIX 4: Standardized Response Schema
File: `server/ca_assist/api/routes/document.py`
File: `app/src/components/DocumentUpload.tsx`
```json
{
  "success": true|false,
  "message": "...",
  "document": { ... },
  "ingest_result": { ... },
  "extracted_data": { ... },
  "extracted_text": "...",
  "chunks_added": 0,
  "error": null
}
```

### ✅ FIX 5: Enhanced Error Logging
File: `app/src/components/DocumentUpload.tsx`
- Logs entire response to console
- Logs parsed fields
- Logs error messages with full stack traces

---

## Next Steps

**PLEASE PROVIDE:**

When you click "Extract & Analyze" and the screen goes blank:

1. **Browser Console Error** (F12 → Console tab)
   - Copy the red error message and stack trace

2. **Backend Terminal Output**
   - Any errors or log messages

3. **Network Tab** (F12 → Network tab)
   - Click the upload request
   - Look at Response tab
   - Is it JSON or HTML?

With this info, I can pinpoint the exact cause and fix it.

---

## Quick Manual Test

If you want to verify JSON response before loading UI:

```bash
cd D:\Hackathon\CA_Assist
python test_document_upload.py <your_auth_token> <path_to_jpeg>
```

This will show you exactly what your backend is returning.

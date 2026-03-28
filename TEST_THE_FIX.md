# HOW TO TEST THE FIX — Document Upload Blank Screen Issue

## Step 0: Verify Backend is Running

```bash
cd D:\Hackathon\CA_Assist
python health_check.py
```

Expected output:
```
✅ Backend is running!
✅ BACKEND IS READY FOR TESTING
```

If you see connection errors, start the backend:
```bash
cd D:\Hackathon\CA_Assist\server
Just run uvicorn from the terminal, or:
uvicorn ca_assist.api.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Step 1: Open the Frontend

1. In browser, go to: `http://localhost:5173` (or wherever frontend is running)
2. Login with your test credentials
3. Navigate to **Document Upload** tab (upload icon)

---

## Step 2: Prepare Test File

You need one of:
- A JPEG/PNG image (e.g., payslip screenshot, salary slip photo)
- A PDF file (e.g., Form 16, salary slip document)
- **Note:** Currently supported: `.pdf`, `.png`, `.jpg`, `.jpeg`

---

## Step 3: Open Browser DevTools

Press `F12` in your browser and go to:
- **Console** tab (to see logs)
- **Network** tab (to see HTTP requests)

---

## Step 4: Upload Document

1. Drag-and-drop or click to select your test file
2. Click **"Extract & Analyze"** button
3. **IMMEDIATELY watch the console**

Expected console output **(in order)**:
```
1. [uploadDocumentAPI] Sending file: filename.jpg size: 12345
2. [uploadDocumentAPI] Success response: 200 {...}
3. Upload response: {success: true, document: {...}, ...}
4. Response type: object
5. Response keys: ['success', 'message', 'document', ...]
6. Response.success: true
7. docInfo: {...}
8. ingestInfo: {...}
9. backendExtractedData: {...}
10. Parsed response: {...}
```

---

## Step 5: Check Results

### If ✅ SUCCESS:
- [ ] Screen does NOT go blank
- [ ] You see "Salary Slip Detected" or document type banner
- [ ] Extracted fields displayed (gross_salary, tds, pf, etc.)
- [ ] Success message shown
- [ ] Console shows all logs above
- [ ] **Network** tab → `/document/upload` request → **Response** tab shows JSON

### If ❌ ERROR (But Screen Stays Visible):
- [ ] Red error box appears with error message
- [ ] Error message is clear and readable
- [ ] Console shows: `=== UPLOAD ERROR ===` followed by error details
- [ ] **Network** tab → `/document/upload` request shows JSON response (not HTML)
- [ ] You can read the error and try again

### If ❌ BLANK SCREEN (The Original Problem):
- [ ] **ErrorBoundary should catch it**
- [ ] You should see an error page instead of blank
- [ ] Error page has: error message + "Reload Application" button
- [ ] If this happens, please share the error message

---

## Step 6: Network Tab Verification

In DevTools, go to **Network** tab:

1. Filter by: **document**
2. Look for: `upload` request (POST to `/document/upload`)
3. Click on it
4. Go to **Response** tab
5. Should see JSON like:
   ```json
   {
     "success": true,
     "message": "Document uploaded and processed successfully.",
     "document": {...},
     "extracted_data": {...}
   }
   ```

**NOT** HTML like:
```html
<!DOCTYPE html>
<html>
  <head>...</head>
</html>
```

---

## Step 7: Test Error Cases

### Test Case 1: Unsupported File
1. Try uploading a `.docx` or `.txt` file
2. Expected: Red error box saying "Only PDF, JPEG, and PNG files are supported."
3. Screen should NOT go blank

### Test Case 2: Empty File
1. Try uploading an empty/corrupted file
2. Expected: Error message from backend
3. Screen should NOT go blank
4. Error message should be visible

### Test Case 3: Multiple Uploads
1. Try uploading multiple files in succession
2. Expected: Each should proceed independently
3. No stuck states or blank screens

---

## Troubleshooting

### "Cannot connect to backend"
- [ ] Is uvicorn running? (check terminal)
- [ ] Is it on `127.0.0.1:8000`? (check command line)
- [ ] Any firewall blocking localhost?

### "Response is HTML"
- [ ] This means an exception occurred in backend
- [ ] Check backend terminal for error traceback
- [ ] May need to install missing dependencies (e.g., Tesseract for OCR)

### "Blank screen still appears"
- [ ] Open DevTools immediately (F12)
- [ ] Copy the error from Console tab
- [ ] Check if ErrorBoundary error page appears instead
- [ ] Share the error message for debugging

### "File validation fails on frontend"
- [ ] File type must be in: `.pdf`, `.png`, `.jpg`, `.jpeg`
- [ ] Check file extension (case-insensitive)
- [ ] Error message should tell you what's wrong

---

## Success Criteria

✅ **The fix is working if:**
1. Screen does NOT go blank when clicking "Extract & Analyze"
2. Either success results or error message is displayed
3. Network response in DevTools shows JSON (not HTML)
4. Console logs show request/response flow
5. ErrorBoundary doesn't activate (unless React crashes)
6. Multiple uploads work without issues

---

## Important Notes

- **First time upload might be slow** (OCR processing can take 5-30 seconds)
- **Tesseract must be installed** for image OCR to work (if you get OCR errors, this is likely the cause)
- **Backend logs** are printed to the uvicorn terminal, not browser
- **Console shows detailed flow** for debugging

---

## Questions?

If you encounter issues:
1. Check `/memories/session/` or `/memories/repo/` for notes
2. Review console output and network response
3. Look at backend terminal output
4. Verify all code changes are in place (check files list above)

---

**Expected Result:** When you click "Extract & Analyze", you'll see processing steps complete and either:
- ✅ Extracted data displayed (no blank screen)
- ✅ Clear error message displayed (no blank screen)
- Never a blank screen again

import json
import PyPDF2
import pytesseract
from PIL import Image
from agents import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
import warnings


class DocumentAgent:
    """
    Agent for extracting financial information from documents.
    Supports: PDF files and image files (PNG, JPG, JPEG)
    Uses OCR (tesseract) for images if available.
    """
    
    REGIME_RELEVANT_KEYWORDS = [
        'salary', 'income', 'ctc', 'gross', 'net', 'salary slip', 'payslip',
        'earnings', 'deductions', 'tds', 'professional tax', 'pf', 'provident fund',
        'esi', 'health insurance', 'form 16', 'form16', 'income statement',
        'hra', 'dearness allowance', 'conveyance', 'medical allowance',
        'section 80c', 'section 80d', 'deduction'
    ]
    
    def handle(self, file_path: str):
        """
        Main handler for document processing.
        Returns dict with extracted data and metadata.
        """
        if not file_path:
            return {
                "gross_salary": None,
                "tds_deducted": None,
                "pf": None,
                "pan": None,
                "gstin": None,
                "document_type": "unknown",
                "is_relevant_for_regime": False,
                "relevance_reason": "No document provided"
            }
            
        ext = file_path.lower().split('.')[-1]
        text = ""
        extraction_error = None

        try:
            if ext == 'pdf':
                text = self._extract_pdf_text(file_path)
            elif ext in ['jpg', 'jpeg', 'png']:
                text = self._extract_image_text(file_path)
            else:
                raise ValueError(f"Unsupported file type: {ext}")
                
        except Exception as e:
            error_msg = f"Failed to read file: {e}"
            print(f"Error: {error_msg}")
            extraction_error = error_msg
            return {
                "gross_salary": None,
                "tds_deducted": None,
                "pf": None,
                "pan": None,
                "gstin": None,
                "document_type": "unknown",
                "is_relevant_for_regime": False,
                "relevance_reason": f"Text extraction failed: {error_msg}"
            }

        if not text.strip():
            return {
                "gross_salary": None,
                "tds_deducted": None,
                "pf": None,
                "pan": None,
                "gstin": None,
                "document_type": "unknown",
                "is_relevant_for_regime": False,
                "relevance_reason": "No readable text found in document"
            }

        return self.parse_text(text)

    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file."""
        text = ""
        try:
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        except Exception as e:
            raise ValueError(f"PDF extraction failed: {e}")
        return text

    def _extract_image_text(self, file_path: str) -> str:
        """Extract text from image using OCR (pytesseract/tesseract)."""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            if not text.strip():
                raise ValueError("No text detected in image")
            return text
        except pytesseract.TesseractNotFoundError:
            raise ValueError(
                "Tesseract OCR not found. Install with: "
                "'apt-get install tesseract-ocr' (Linux) or "
                "'brew install tesseract' (macOS) or download from "
                "'https://github.com/UB-Mannheim/tesseract/wiki' (Windows)"
            )
        except Exception as e:
            raise ValueError(f"Image OCR extraction failed: {e}")

    def _classify_document_type(self, text: str) -> tuple[str, bool]:
        """
        Classify document type using content analysis (LLM) and heuristics.
        
        Returns:
            (document_type, is_relevant_for_regime)
            
        Document types: 'salary_slip', 'form16', 'invoice', 'other'
        """
        text_lower = text.lower()
        
        # Phase 1: Quick heuristic checks
        salary_keywords = ['salary', 'slip', 'payslip', 'ctc', 'earnings', 'gross salary', 'net salary']
        form16_keywords = ['form 16', 'form16', 'annual', 'financial year', 'employer', 'income']
        invoice_keywords = ['invoice', 'bill', 'customer', 'amount due', 'quantity', 'rate']
        
        salary_matches = sum(1 for kw in salary_keywords if kw in text_lower)
        form16_matches = sum(1 for kw in form16_keywords if kw in text_lower)
        invoice_matches = sum(1 for kw in invoice_keywords if kw in text_lower)
        max_matches = max(salary_matches, form16_matches, invoice_matches)
        
        if max_matches > 0:
            if salary_matches == max_matches:
                doc_type = 'salary_slip'
            elif form16_matches == max_matches:
                doc_type = 'form16'
            elif invoice_matches == max_matches:
                doc_type = 'invoice'
            else:
                doc_type = 'other'
        else:
            doc_type = 'other'
        
        # Phase 2: LLM classification for accuracy if heuristics inconclusive
        if max_matches <= 1 and len(text) > 100:
            try:
                doc_type = self._classify_with_llm(text)
            except Exception as e:
                warnings.warn(f"LLM classification failed, using heuristics: {e}")
                # Continue with heuristic result
        
        # Determine relevance for regime calculations
        is_relevant = doc_type in ['salary_slip', 'form16']
        
        return doc_type, is_relevant

    def _classify_with_llm(self, text: str) -> str:
        """Use LLM to classify document type."""
        try:
            llm = get_llm()
            system_prompt = (
                "Classify the document type. Return ONLY one of these words: "
                "'salary_slip', 'form16', 'invoice', or 'other'. "
                "No explanation needed."
            )
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=text[:2000])  # Limit text for faster inference
            ]
            response = llm.invoke(messages)
            result = response.content.strip().lower()
            
            valid_types = ['salary_slip', 'form16', 'invoice', 'other']
            if result in valid_types:
                return result
            return 'other'
        except Exception as e:
            raise e

    def parse_text(self, text: str):
        """
        Extract financial fields from document text using LLM.
        Includes document classification and relevance detection.
        """
        if not text.strip():
            return {
                "gross_salary": None,
                "tds_deducted": None,
                "pf": None,
                "pan": None,
                "gstin": None,
                "document_type": "unknown",
                "is_relevant_for_regime": False,
                "relevance_reason": "Document is empty"
            }
        
        # Classify document and check relevance
        doc_type, is_relevant = self._classify_document_type(text)
        relevance_reason = None
        
        if not is_relevant:
            relevance_reason = (
                f"This {doc_type} is not applicable for regime calculations. "
                "Please upload a salary slip or Form 16."
            )
        
        # Extract fields using LLM
        llm = get_llm()
        system_prompt = (
            "Extract these financial fields from the document text: "
            "gross_salary, tds_deducted, pf, pan, gstin. "
            "Return ONLY valid JSON with these exact keys. "
            "Format currency values as numbers (e.g., 50000 not '50,000'). "
            "If a field is not found, use null. "
            "Example: {\"gross_salary\": 900000, \"tds_deducted\": 15000, \"pf\": 50000, \"pan\": \"ABCDE1234F\", \"gstin\": null}"
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=text)
        ]

        extracted_data = {
            "gross_salary": None,
            "tds_deducted": None,
            "pf": None,
            "pan": None,
            "gstin": None,
            "document_type": doc_type,
            "is_relevant_for_regime": is_relevant,
            "relevance_reason": relevance_reason
        }

        try:
            res = llm.invoke(messages)
            content = res.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            # Parse JSON and merge with metadata
            parsed = json.loads(content)
            extracted_data.update(parsed)
            
            # Ensure metadata is present
            extracted_data["document_type"] = doc_type
            extracted_data["is_relevant_for_regime"] = is_relevant
            extracted_data["relevance_reason"] = relevance_reason
            
        except json.JSONDecodeError as e:
            print(f"Error parsing LLM response as JSON: {e}")
            # Return default null values but keep metadata
            extracted_data["document_type"] = doc_type
            extracted_data["is_relevant_for_regime"] = is_relevant
            extracted_data["relevance_reason"] = (
                relevance_reason or 
                "Could not extract financial data from document (Parsing error)"
            )
        except Exception as e:
            print(f"Error parsing document with LLM: {e}")
            # Return default null values but keep metadata
            extracted_data["document_type"] = doc_type
            extracted_data["is_relevant_for_regime"] = is_relevant
            extracted_data["relevance_reason"] = (
                relevance_reason or 
                f"LLM processing error: {str(e)}"
            )

        return extracted_data

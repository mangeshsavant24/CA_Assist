import json
import PyPDF2
from PIL import Image
import pytesseract
from agents import get_llm
from langchain_core.messages import SystemMessage, HumanMessage

class DocumentAgent:
    def handle(self, file_path: str):
        if not file_path:
            return {"gross_salary": None}
            
        ext = file_path.lower().split('.')[-1]
        text = ""

        try:
            if ext == 'pdf':
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
            elif ext in ['jpg', 'jpeg', 'png']:
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img)
        except Exception as e:
            print(f"Failed to read file: {e}")

        return self.parse_text(text)

    def parse_text(self, text: str):
        if not text.strip():
            return {"gross_salary": None, "tds_deducted": None, "pf": None, "pan": None, "gstin": None}
            
        llm = get_llm()
        system_prompt = (
            "Extract these fields from the document text: gross_salary, tds_deducted, pf, pan, gstin. "
            "Return only valid JSON with these keys formatting numbers as floats and strings as strings or null if missing."
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=text)
        ]

        try:
            res = llm.invoke(messages)
            content = res.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            return json.loads(content)
        except Exception as e:
            print(f"Error parsing document with LLM: {e}")
            return {"gross_salary": None, "tds_deducted": None, "pf": None, "pan": None, "gstin": None}

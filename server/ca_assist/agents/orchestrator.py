import json
from langchain_core.messages import SystemMessage, HumanMessage
from api.schemas import Intent
from . import get_llm

class Orchestrator:
    def __init__(self):
        self.llm = get_llm()
        self.system_prompt = (
            "You are an intent classifier for a CA virtual assistant. "
            "Based on the user's query, return a JSON object with a single key 'intent'. "
            "The value must be exactly one of: TAX_QUERY, GST_QUERY, DOCUMENT_UPLOAD, ADVISORY, REGIME_COMPARE. "
            "Return only valid JSON."
        )

    def classify_intent(self, query: str) -> Intent:
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=query)
        ]

        try:
            response = self.llm.invoke(messages)
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()

            data = json.loads(content)
            intent_str = data.get("intent", "TAX_QUERY")
            return Intent(intent_str)
        except Exception as e:
            print(f"Classification failed: {e}. Defaulting to TAX_QUERY.")
            return Intent.TAX_QUERY

    def route(self, intent: Intent, query: str = "", **kwargs):
        if intent == Intent.REGIME_COMPARE:
            return None # Expected to be handled by API caller
        elif intent == Intent.TAX_QUERY:
            from .tax_agent import TaxAgent
            return TaxAgent().handle(query)
        elif intent == Intent.GST_QUERY:
            from .gst_agent import GSTAgent
            return GSTAgent().handle(query)
        elif intent == Intent.DOCUMENT_UPLOAD:
            from .document_agent import DocumentAgent
            return DocumentAgent().handle(kwargs.get("file_path"))
        elif intent == Intent.ADVISORY:
            from .advisory_agent import AdvisoryAgent
            return AdvisoryAgent().handle(query)

        return {"answer": "Intent not supported yet.", "citations": []}

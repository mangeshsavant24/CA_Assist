import json
from langchain_core.messages import SystemMessage, HumanMessage
from api.schemas import Intent
from agents import get_llm

class Orchestrator:
    def __init__(self):
        self.llm = get_llm()
        self.system_prompt = (
            "You are an intent classifier for a CA virtual assistant. "
            "Based on the user's query, return a JSON object with a single key 'intent'. "
            "The value must be exactly one of: TAX_QUERY, GST_QUERY, DOCUMENT_UPLOAD, ADVISORY, REGIME_COMPARE, "
            "FOREX_VALUATION. "
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

    def route(self, intent: Intent, query: str = "", original_query: str = "", **kwargs):
        """
        Route the query to the correct agent.

        Parameters
        ----------
        query          : The enriched RAG prompt (context + question) built
                         by rag_engine.build_rag_prompt(). Agents should use
                         this so they benefit from per-user RAG context.
        original_query : The raw user question, used for display / logging.
        """
        if intent == Intent.REGIME_COMPARE:
            return None  # Expected to be handled by API caller
        elif intent == Intent.TAX_QUERY:
            from agents.tax_agent import TaxAgent
            return TaxAgent().handle(query or original_query)
        elif intent == Intent.GST_QUERY:
            from agents.gst_agent import GSTAgent
            return GSTAgent().handle(query or original_query)
        elif intent == Intent.DOCUMENT_UPLOAD:
            from agents.document_agent import DocumentAgent
            return DocumentAgent().handle(kwargs.get("file_path"))
        elif intent == Intent.ADVISORY:
            from agents.advisory_agent import AdvisoryAgent
            return AdvisoryAgent().handle(query or original_query)
        elif intent == Intent.FOREX_VALUATION:
            from agents.forex_agent import ForexAgent
            return ForexAgent().handle(query or original_query)

        return {"answer": "Intent not supported yet.", "citations": []}

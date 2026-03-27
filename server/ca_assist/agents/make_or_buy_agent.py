from agents import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage


class MakeOrBuyAgent:
    """Agent for make-or-buy decision analysis queries."""

    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are a make-or-buy decision analysis agent. Handle queries about outsourcing vs in-house "
            "production decisions, capital investment analysis, supply chain management, "
            "and strategic sourcing. Cite relevant financial analysis standards and costing principles. "
            "Provide guidance on qualitative factors, risk assessment, and supplier evaluation."
        )

    def handle(self, query: str, context_data: dict = None):
        """Process make-or-buy decision query."""
        docs = fetch_relevant_docs(
            f"make or buy outsourcing sourcing decision analysis {query}"
        )
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"
        if context_data:
            prompt += f"\n\nDecision Data:\n{context_data}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt),
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

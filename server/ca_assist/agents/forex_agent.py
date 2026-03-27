from agents import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage


class ForexAgent:
    """Agent for forex valuation and hedging strategy queries."""

    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are a forex valuation agent. Handle queries about foreign exchange exposure valuation, "
            "hedging strategies, spot rates, forward premiums, and tax treatment of forex gains/losses. "
            "Cite relevant sections of I.T. Act (Section 43, 45, 48) and accounting standards (AS-11, IND-AS 21). "
            "Provide practical guidance on forex risk management for businesses and exporters."
        )

    def handle(self, query: str, context_data: dict = None):
        """Process forex-related query."""
        docs = fetch_relevant_docs(f"forex valuation hedging {query}")
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"
        if context_data:
            prompt += f"\n\nFinancial Data:\n{context_data}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt),
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

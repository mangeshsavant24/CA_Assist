from agents import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage


class CostingAgent:
    """Agent for costing analysis and financial forecasting queries."""

    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are a costing and forecasting agent. Handle queries about cost accounting, "
            "breakeven analysis, contribution margin, fixed vs variable costs, budgeting, "
            "and profit/loss forecasting. Cite relevant SA and costing standards (CMA guidelines). "
            "Provide guidance on pricing strategies, variance analysis, and cost control measures."
        )

    def handle(self, query: str, context_data: dict = None):
        """Process costing and forecasting query."""
        docs = fetch_relevant_docs(
            f"costing analysis breakeven contribution margin forecasting {query}"
        )
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"
        if context_data:
            prompt += f"\n\nCosting Data:\n{context_data}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt),
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

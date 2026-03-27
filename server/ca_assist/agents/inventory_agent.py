from agents import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage


class InventoryAgent:
    """Agent for inventory valuation and stock management queries."""

    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are an inventory valuation agent. Handle queries about inventory valuation methods "
            "(FIFO, LIFO, WAC, Standard Cost), obsolescence assessment, stock management, "
            "and inventory accounting. Cite AS-2 and IND-AS 2 standards, Section 145(2) of I.T. Act. "
            "Provide guidance on inventory provisioning, write-offs, and disclosure requirements."
        )

    def handle(self, query: str, context_data: dict = None):
        """Process inventory-related query."""
        docs = fetch_relevant_docs(f"inventory valuation FIFO LIFO obsolescence {query}")
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"
        if context_data:
            prompt += f"\n\nInventory Data:\n{context_data}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt),
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

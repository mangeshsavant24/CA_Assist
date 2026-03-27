from agents import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage

class TaxAgent:
    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are a tax agent. Handles: income tax Q&A, deductions, TDS, AIS, Form 26AS. "
            "Always cite the specific section of the Income Tax Act 2025 in your response. "
            "Format: [Section X, IT Act 2025]. "
            "Use the provided retrieved context to answer the question accurately."
        )

    def handle(self, query: str):
        # We fetch sections
        docs = fetch_relevant_docs(query, filter_kwargs={"chunk_type": "section"})
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt)
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

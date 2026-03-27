from . import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage

class AdvisoryAgent:
    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are an advisory agent. Handles tax-saving recommendations, investment suggestions, compliance. "
            "Give actionable advice. Cite every recommendation. Ground your advice in RAG retrieval from ICAI standards."
        )

    def handle(self, query: str, context_data: dict = None):
        docs = fetch_relevant_docs(query)
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"
        if context_data:
            prompt += f"\n\nExtracted Financial Data:\n{context_data}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt)
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

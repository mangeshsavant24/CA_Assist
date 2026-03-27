from . import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage

class GSTAgent:
    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are a GST agent. Handles: GST rate lookup, GSTR filing guidance, ITC eligibility, GSTIN. "
            "Always cite the CBIC circular number or GST Act section. Format: [Circular No. XX/YYYY, CBIC]. "
            "Use the retrieved context."
        )

    def handle(self, query: str):
        # Fetch circular docs
        docs = fetch_relevant_docs(query, filter_kwargs={"chunk_type": "circular"})
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt)
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

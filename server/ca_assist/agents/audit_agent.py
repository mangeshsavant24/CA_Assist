from agents import get_llm
from rag.retriever import fetch_relevant_docs
from engines.citation_engine import CitationEngine
from langchain_core.messages import SystemMessage, HumanMessage


class AuditAgent:
    """Agent for financial and statutory audit queries."""

    def __init__(self):
        self.llm = get_llm()
        self.citation_engine = CitationEngine()
        self.system_prompt = (
            "You are a financial audit agent. Handle queries about statutory audits, internal audits, "
            "compliance audits, audit procedures, audit sampling, materiality assessment, and audit reporting. "
            "Cite relevant Standards on Auditing (SA), ICAI guidelines, Companies Act provisions, and FEMA regulations. "
            "Provide guidance on audit planning, risk assessment, audit evidence, and audit conclusions."
        )

    def handle(self, query: str, context_data: dict = None):
        """Process audit-related query."""
        docs = fetch_relevant_docs(
            f"audit statutory compliance audit procedures materiality {query}"
        )
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"Context:\n{context}\n\nQuery:\n{query}"
        if context_data:
            prompt += f"\n\nAudit Context:\n{context_data}"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt),
        ]

        res = self.llm.invoke(messages)
        return self.citation_engine.attach_citations(res.content, docs)

from engines.citation_engine import CitationEngine
from langchain_core.documents import Document

def test_citation_engine():
    engine = CitationEngine()
    docs = [
        Document(page_content="some text", metadata={"act": "Income Tax Act 2025", "section": "80C", "chunk_type": "section"}),
        Document(page_content="some text", metadata={"circular_id": "12/2023", "chunk_type": "circular"})
    ]
    res = engine.attach_citations("Here is the answer.", docs)
    assert len(res.citations) == 2
    assert "Section 80C" in res.citations[0].source
    assert "Circular No. 12/2023" in res.citations[1].source
    assert "[1] Section 80C" in res.answer
    assert "[2] Circular No. 12/2023" in res.answer

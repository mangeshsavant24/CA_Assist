import re
from typing import List
from api.schemas import CitedResponse, Citation

class CitationEngine:
    def attach_citations(self, response: str, source_docs: list) -> CitedResponse:
        citations: List[Citation] = []
        appended_response = response + "\n\nCitations:\n"
        
        for idx, doc in enumerate(source_docs, start=1):
            meta = doc.metadata
            act = meta.get("act", "Unknown Act")
            section = meta.get("section", "")
            circular_id = meta.get("circular_id", "")
            
            source_name = ""
            if section:
                source_name = f"Section {section}, {act}"
            elif circular_id:
                source_name = f"Circular No. {circular_id}"
            else:
                source_name = f"Source {idx}"
                
            citation = Citation(
                source=source_name,
                section=section,
                act=act,
                url=meta.get("url")
            )
            citations.append(citation)
            appended_response += f"[{idx}] {source_name}\n"
            
        return CitedResponse(answer=appended_response.strip(), citations=citations)

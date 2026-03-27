import json
from agents import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
from api.schemas import CitedResponse, Citation

class ForexAgent:
    def __init__(self):
        self.llm = get_llm()
        self.system_prompt = (
            "You are an expert Chartered Accountant specializing in Forex Valuation (AS-11 / Ind AS 21 / IFRS 9). "
            "Address the user's queries about foreign exchange, hedging options, recognizing gain/loss, translation of financial statements, and compliance. "
            "Keep the response concise and accurate."
        )

    def handle(self, query: str) -> CitedResponse:
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=query)
        ]

        try:
            response = self.llm.invoke(messages)
            content = response.content
            
            return CitedResponse(
                answer=content,
                citations=[Citation(source="Accounting Standard 11", section="Effects of Changes in Foreign Exchange Rates", act="Companies Act", url=None)]
            )
        except Exception as e:
            print(f"ForexAgent error: {e}")
            return CitedResponse(answer="I'm unable to answer your query about Forex valuation at this moment.", citations=[])

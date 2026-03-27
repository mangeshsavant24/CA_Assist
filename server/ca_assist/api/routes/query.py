from fastapi import APIRouter
from pydantic import BaseModel
from api.schemas import CitedResponse
from agents.orchestrator import Orchestrator

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    user_id: str

@router.post("", response_model=CitedResponse)
def handle_query(request: QueryRequest):
    try:
        orchestrator = Orchestrator()
        intent = orchestrator.classify_intent(request.query)
        
        if intent.value == "REGIME_COMPARE":
            return CitedResponse(answer="Please use the /regime/compare endpoint for calculations.", citations=[])
            
        result = orchestrator.route(intent=intent, query=request.query)
        return result
    except Exception as e:
        print(f"Query Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return CitedResponse(answer=f"Error: {str(e)}", citations=[])

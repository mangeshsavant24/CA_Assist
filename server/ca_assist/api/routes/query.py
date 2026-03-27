from fastapi import APIRouter, Depends
from pydantic import BaseModel
from api.schemas import CitedResponse
from api.dependencies import get_current_user
from models import User
from agents.orchestrator import Orchestrator

router = APIRouter()

class QueryRequest(BaseModel):
    query: str

@router.post("", response_model=CitedResponse)
def handle_query(request: QueryRequest, current_user: User = Depends(get_current_user)):
    orchestrator = Orchestrator()
    intent = orchestrator.classify_intent(request.query)
    
    if intent.value == "REGIME_COMPARE":
        return CitedResponse(answer="Please use the /regime/compare endpoint for calculations.", citations=[])
        
    result = orchestrator.route(intent=intent, query=request.query)
    return result

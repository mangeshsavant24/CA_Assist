from fastapi import APIRouter, Depends
from api.schemas import RegimeInput, RegimeOutput
from api.dependencies import get_current_user
from models import User
from engines.regime_engine import RegimeEngine

router = APIRouter()
engine = RegimeEngine()

@router.post("/compare", response_model=RegimeOutput)
def compare_regimes(request: RegimeInput, current_user: User = Depends(get_current_user)):
    return engine.compare(request)

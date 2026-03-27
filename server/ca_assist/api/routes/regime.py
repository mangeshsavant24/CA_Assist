from fastapi import APIRouter
from api.schemas import RegimeInput, RegimeOutput
from engines.regime_engine import RegimeEngine

router = APIRouter()
engine = RegimeEngine()

@router.post("/compare", response_model=RegimeOutput)
def compare_regimes(request: RegimeInput):
    return engine.compare(request)

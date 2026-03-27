from fastapi import APIRouter
from api.schemas import ForexValuationInput, ForexValuationOutput
from engines.forex_engine import ForexEngine

router = APIRouter()
engine = ForexEngine()

@router.post("/evaluate", response_model=ForexValuationOutput)
def evaluate_forex(input_data: ForexValuationInput):
    """
    Evaluates Forex Exposures
    """
    return engine.evaluate_valuation(input_data)

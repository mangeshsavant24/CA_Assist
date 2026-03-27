from fastapi import APIRouter, Depends
from api.schemas import ForexValuationInput, ForexValuationOutput
from api.dependencies import get_current_user
from models import User
from engines.forex_engine import ForexValuationEngine

router = APIRouter()
engine = ForexValuationEngine()


@router.post("/valuate", response_model=ForexValuationOutput)
def valuate_forex(
    request: ForexValuationInput, current_user: User = Depends(get_current_user)
):
    """Valuate foreign exchange exposure."""
    return engine.evaluate(request)

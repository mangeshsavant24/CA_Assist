from fastapi import APIRouter, Depends
from api.schemas import MakeOrBuyInput, MakeOrBuyOutput
from api.dependencies import get_current_user
from models import User
from engines.make_or_buy_engine import MakeOrBuyEngine

router = APIRouter()
engine = MakeOrBuyEngine()


@router.post("/analyze", response_model=MakeOrBuyOutput)
def analyze_make_or_buy(
    request: MakeOrBuyInput, current_user: User = Depends(get_current_user)
):
    """Analyze make vs buy decision."""
    return engine.evaluate(request)

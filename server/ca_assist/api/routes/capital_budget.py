from fastapi import APIRouter, Depends
from api.schemas import CapitalBudgetInput, CapitalBudgetOutput
from api.dependencies import get_current_user
from models import User
from engines.capital_budgeting_engine import CapitalBudgetingEngine

router = APIRouter()
engine = CapitalBudgetingEngine()

@router.post("/evaluate", response_model=CapitalBudgetOutput)
def evaluate_capital_budget(request: CapitalBudgetInput, current_user: User = Depends(get_current_user)):
    return engine.evaluate(request)

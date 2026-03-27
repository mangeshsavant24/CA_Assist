from fastapi import APIRouter, Depends
from api.schemas import FundInput, FundOutput
from api.dependencies import get_current_user
from models import User
from engines.fund_accounting_engine import FundAccountingEngine

router = APIRouter()
engine = FundAccountingEngine()


@router.post("/nav", response_model=FundOutput)
def calculate_fund_nav(request: FundInput, current_user: User = Depends(get_current_user)):
    return engine.calculate_fund_nav(request)

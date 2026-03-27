from fastapi import APIRouter, Depends
from api.schemas import FinancialAuditInput, FinancialAuditOutput
from api.dependencies import get_current_user
from models import User
from engines.financial_audit_engine import FinancialAuditEngine

router = APIRouter()
engine = FinancialAuditEngine()


@router.post("/conduct", response_model=FinancialAuditOutput)
def conduct_audit(
    request: FinancialAuditInput, current_user: User = Depends(get_current_user)
):
    """Conduct financial audit assessment."""
    return engine.evaluate(request)

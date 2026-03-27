from fastapi import APIRouter, Depends
from api.schemas import CostingForecastInput, CostingForecastOutput
from api.dependencies import get_current_user
from models import User
from engines.costing_forecasting_engine import CostingForecastingEngine

router = APIRouter()
engine = CostingForecastingEngine()


@router.post("/analyze", response_model=CostingForecastOutput)
def analyze_costing_forecast(
    request: CostingForecastInput, current_user: User = Depends(get_current_user)
):
    """Analyze costing and forecast profit/loss."""
    return engine.evaluate(request)

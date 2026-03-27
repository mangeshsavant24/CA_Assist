from fastapi import APIRouter, Depends
from api.schemas import InventoryValuationInput, InventoryValuationOutput
from api.dependencies import get_current_user
from models import User
from engines.inventory_valuation_engine import InventoryValuationEngine

router = APIRouter()
engine = InventoryValuationEngine()


@router.post("/valuate", response_model=InventoryValuationOutput)
def valuate_inventory(
    request: InventoryValuationInput, current_user: User = Depends(get_current_user)
):
    """Valuate inventory per AS-2/IND-AS 2 standards."""
    return engine.evaluate(request)

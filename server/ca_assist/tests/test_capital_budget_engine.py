import pytest
from api.schemas import CapitalBudgetInput
from engines.capital_budgeting_engine import CapitalBudgetingEngine

def test_capital_budget_npv_positive():
    engine = CapitalBudgetingEngine()
    req = CapitalBudgetInput(initial_investment=100000, cash_flows=[40000, 50000, 60000], discount_rate=10, currency='INR')
    res = engine.evaluate(req)
    assert res.currency == 'INR'
    assert res.npv > 0
    assert res.recommendation.startswith("Accept")


def test_capital_budget_irr_payback():
    engine = CapitalBudgetingEngine()
    req = CapitalBudgetInput(initial_investment=50000, cash_flows=[20000, 25000, 15000], discount_rate=8)
    res = engine.evaluate(req)
    assert res.irr is not None
    assert res.payback_period is not None
    assert res.profitability_index is not None

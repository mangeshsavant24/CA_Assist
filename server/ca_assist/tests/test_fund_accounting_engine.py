import pytest
from api.schemas import FundInput, FundTransaction
from engines.fund_accounting_engine import FundAccountingEngine


def test_fund_nav_basic():
    engine = FundAccountingEngine()
    req = FundInput(
        fund_name="Retirement Fund",
        fund_type="General",
        opening_balance=100000,
        share_classes=1000,
        transactions=[
            FundTransaction(transaction_type="contribution", amount=50000, date="2025-01", description="Annual contribution"),
            FundTransaction(transaction_type="return", amount=15000, date="2025-03", description="Investment returns"),
        ],
    )
    res = engine.calculate_fund_nav(req)
    
    assert res.nav_detail.fund_name == "Retirement Fund"
    assert res.nav_detail.closing_balance == 165000  # 100k + 50k + 15k
    assert res.nav_detail.nav_per_unit == 165  # 165000 / 1000
    assert res.currency == "INR"


def test_fund_with_withdrawal():
    engine = FundAccountingEngine()
    req = FundInput(
        fund_name="Education Fund",
        fund_type="Restricted",
        opening_balance=200000,
        share_classes=500,
        transactions=[
            FundTransaction(transaction_type="contribution", amount=100000, date="2025-01"),
            FundTransaction(transaction_type="withdrawal", amount=50000, date="2025-02"),
            FundTransaction(transaction_type="return", amount=30000, date="2025-03"),
        ],
    )
    res = engine.calculate_fund_nav(req)
    
    assert res.nav_detail.total_contributions == 100000
    assert res.nav_detail.total_withdrawals == 50000
    assert res.nav_detail.total_returns == 30000
    assert res.nav_detail.closing_balance == 280000  # 200k + 100k - 50k + 30k
    assert res.nav_detail.ledger_entries[0]["transaction_type"] == "opening"


def test_fund_roi_calculation():
    engine = FundAccountingEngine()
    req = FundInput(
        fund_name="Investment Fund",
        fund_type="General",
        opening_balance=100000,
        share_classes=1,
        transactions=[
            FundTransaction(transaction_type="contribution", amount=50000),
            FundTransaction(transaction_type="return", amount=20000),
        ],
    )
    res = engine.calculate_fund_nav(req)
    
    # ROI = 20000 / (100000 + 50000) * 100 = 13.33%
    assert res.nav_detail.roi_percentage > 13


def test_fund_negative_roi():
    engine = FundAccountingEngine()
    req = FundInput(
        fund_name="Struggling Fund",
        fund_type="Other",
        opening_balance=100000,
        share_classes=1000,
        transactions=[
            FundTransaction(transaction_type="return", amount=-10000, description="Market loss"),
        ],
    )
    res = engine.calculate_fund_nav(req)
    
    assert res.nav_detail.closing_balance == 90000
    assert res.nav_detail.roi_percentage < 0
    assert "Negative" in res.recommendation

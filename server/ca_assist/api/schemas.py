from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum

class RegimeInput(BaseModel):
    gross_income: float
    sec_80c: float = 0.0
    sec_80d: float = 0.0
    hra_exemption: float = 0.0
    other_deductions: float = 0.0

class SlabBreakdownItem(BaseModel):
    slab: str
    rate: str
    tax: float

class RegimeDetail(BaseModel):
    taxable_income: float
    total_deductions: Optional[float] = None
    slab_breakdown: List[SlabBreakdownItem]
    base_tax: float
    cess: float
    rebate: float
    total_tax: float

class Verdict(BaseModel):
    recommended_regime: str
    tax_saving: float
    saving_percentage: float
    reason: str

class RegimeOutput(BaseModel):
    old_regime: RegimeDetail
    new_regime: RegimeDetail
    verdict: Verdict
    citations: List[str]

class Citation(BaseModel):
    source: str
    section: str
    act: str
    url: Optional[str] = None

class CitedResponse(BaseModel):
    answer: str
    citations: List[Citation]

class CapitalBudgetInput(BaseModel):
    initial_investment: float
    cash_flows: List[float]
    discount_rate: float
    project_name: Optional[str] = None
    currency: Literal['INR', 'USD'] = 'INR'

class CapitalBudgetOutput(BaseModel):
    project_name: Optional[str]
    currency: Literal['INR', 'USD']
    npv: float
    irr: Optional[float]
    payback_period: Optional[float]
    profitability_index: Optional[float]
    recommendation: str


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: str

    class Config:
        orm_mode = True


class Intent(str, Enum):
    TAX_QUERY = "TAX_QUERY"
    GST_QUERY = "GST_QUERY"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    ADVISORY = "ADVISORY"
    REGIME_COMPARE = "REGIME_COMPARE"
    FOREX_VALUATION = "FOREX_VALUATION"
    INVENTORY_VALUATION = "INVENTORY_VALUATION"
    COSTING_FORECASTING = "COSTING_FORECASTING"
    MAKE_OR_BUY = "MAKE_OR_BUY"
    FINANCIAL_AUDIT = "FINANCIAL_AUDIT"


class FundTransaction(BaseModel):
    transaction_type: Literal['contribution', 'withdrawal', 'return']
    amount: float
    date: Optional[str] = None
    description: Optional[str] = None


class NAVDetail(BaseModel):
    fund_name: str
    fund_type: Literal['General', 'Endowment', 'Restricted', 'Other']
    opening_balance: float
    total_contributions: float
    total_withdrawals: float
    total_returns: float
    closing_balance: float
    share_classes: int
    nav_per_unit: float
    roi_percentage: float
    transaction_count: int
    ledger_entries: List[dict]


class FundInput(BaseModel):
    fund_name: str
    fund_type: Literal['General', 'Endowment', 'Restricted', 'Other']
    opening_balance: float
    share_classes: Optional[int] = 1
    transactions: List[FundTransaction]
    currency: Optional[Literal['INR', 'USD']] = 'INR'


class FundOutput(BaseModel):
    nav_detail: NAVDetail
    recommendation: str
    currency: Literal['INR', 'USD']


# ===== FOREX VALUATION SCHEMAS =====
class ForexExposure(BaseModel):
    currency: str  # e.g., "USD", "EUR", "GBP"
    amount: float
    transaction_rate: Optional[float] = None
    settlement_date: Optional[str] = None


class ForexValuationInput(BaseModel):
    exposure_date: str
    exposures: List[ForexExposure]
    valuation_method: Literal['Current Rate', 'Covering Rate', 'Average Rate'] = 'Current Rate'
    currency: Literal['INR', 'USD'] = 'INR'


class ForexValuationOutput(BaseModel):
    exposure_date: str
    total_exposure_inr: float
    valuation_method: str
    forex_gain_loss: float
    treatment: str  # Taxable/Non-taxable treatment
    recommendation: str
    currency: Literal['INR', 'USD']


# ===== INVENTORY VALUATION SCHEMAS =====
class InventoryUnit(BaseModel):
    item_code: str
    quantity: int
    unit_cost: float
    valuation_method: Literal['FIFO', 'LIFO', 'WAC', 'Standard']


class InventoryValuationInput(BaseModel):
    inventory_units: List[InventoryUnit]
    valuation_date: str
    nrv_per_unit: Optional[float] = None
    currency: Literal['INR', 'USD'] = 'INR'


class InventoryValuationOutput(BaseModel):
    total_quantity: int
    book_value: float
    net_realizable_value: float
    final_valuation: float
    write_off_required: float
    compliance_note: str
    currency: Literal['INR', 'USD']


# ===== COSTING & FORECASTING SCHEMAS =====
class CostingForecastInput(BaseModel):
    project_name: str
    fixed_costs: float
    variable_cost_per_unit: float
    selling_price_per_unit: float
    forecasted_units: List[int]  # Units for each period
    periods: int
    currency: Literal['INR', 'USD'] = 'INR'


class CostingForecastOutput(BaseModel):
    project_name: str
    breakeven_point: float
    contribution_margin_per_unit: float
    contribution_margin_ratio: float
    forecasted_profit_loss: List[float]  # For each period
    total_forecast_profit: float
    recommendation: str
    currency: Literal['INR', 'USD']


# ===== MAKE OR BUY DECISION SCHEMAS =====
class MakeOrBuyOption(BaseModel):
    option_name: str  # "Make" or "Buy"
    annual_volume: int
    setup_cost: Optional[float] = 0
    per_unit_cost: float
    quality_score: float  # 0-100
    lead_time_days: int
    supplier_reliability: Optional[str] = None


class MakeOrBuyInput(BaseModel):
    product_name: str
    options: List[MakeOrBuyOption]
    analysis_period_years: int
    discount_rate: float = 10.0
    currency: Literal['INR', 'USD'] = 'INR'


class MakeOrBuyOutput(BaseModel):
    product_name: str
    recommended_option: str
    total_costs_comparison: dict  # {option_name: total_cost}
    npv_analysis: dict
    qualitative_factors: dict
    risk_assessment: str
    recommendation: str
    currency: Literal['INR', 'USD']


# ===== FINANCIAL AUDIT SCHEMAS =====
class AuditFinding(BaseModel):
    area: str
    severity: Literal['Critical', 'High', 'Medium', 'Low']
    finding: str
    recommendation: str


class FinancialAuditInput(BaseModel):
    audit_type: Literal['Statutory', 'Internal', 'Compliance', 'Forensic']
    company_name: str
    fiscal_year: str
    audit_scope: List[str]  # e.g., ["Revenue", "Inventory", "Receivables"]
    currency: Literal['INR', 'USD'] = 'INR'


class FinancialAuditOutput(BaseModel):
    audit_type: str
    company_name: str
    fiscal_year: str
    findings: List[AuditFinding]
    overall_assessment: str
    compliance_status: str
    materiality_threshold: float
    auditor_recommendation: str
    currency: Literal['INR', 'USD']

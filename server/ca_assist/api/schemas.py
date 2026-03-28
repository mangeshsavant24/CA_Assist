from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum

class HistoryMessage(BaseModel):
    """A single message in the conversation history."""
    role: Literal['user', 'assistant']
    content: str

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

class QueryRequest(BaseModel):
    """Chat query with optional conversation history for context."""
    query: str
    history: Optional[List[HistoryMessage]] = None

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
        from_attributes = True


class Intent(str, Enum):
    TAX_QUERY = "TAX_QUERY"
    GST_QUERY = "GST_QUERY"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    ADVISORY = "ADVISORY"
    REGIME_COMPARE = "REGIME_COMPARE"
    FOREX_VALUATION = "FOREX_VALUATION"


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
    id: str
    currency_pair: str
    exposure_type: Literal['Receivable', 'Payable']
    foreign_amount: float
    initial_rate: float
    current_rate: float
    description: Optional[str] = None

class ForexValuationInput(BaseModel):
    valuation_date: str
    base_currency: str = "INR"
    exposures: List[ForexExposure]

class ForexExposureResult(BaseModel):
    id: str
    currency_pair: str
    exposure_type: str
    foreign_amount: float
    initial_base_value: float
    current_base_value: float
    gain_loss: float
    status: Literal['Gain', 'Loss', 'Neutral']
    description: Optional[str]

class ForexValuationOutput(BaseModel):
    valuation_date: str
    base_currency: str
    total_initial_value: float
    total_current_value: float
    net_gain_loss: float
    results: List[ForexExposureResult]
    recommendation: str

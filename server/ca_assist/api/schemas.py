from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class RegimeInput(BaseModel):
    gross_income: float
    sec_80c: float = 0.0
    sec_80d: float = 0.0
    hra_exemption: float = 0.0

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

class Intent(str, Enum):
    TAX_QUERY = "TAX_QUERY"
    GST_QUERY = "GST_QUERY"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    ADVISORY = "ADVISORY"
    REGIME_COMPARE = "REGIME_COMPARE"

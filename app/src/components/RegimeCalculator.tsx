import React, { useState, useEffect } from 'react';
import {
  Calculator,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingDown,
  FileText,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { compareRegimeAPI, evaluateCapitalBudgetAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/appStore';

interface CapitalBudgetOutput {
  project_name?: string;
  currency: 'INR' | 'USD';
  npv: number;
  irr?: number;
  payback_period?: number;
  profitability_index?: number;
  recommendation: string;
}

interface RegimeOutput {
  old_regime: RegimeData;
  new_regime: RegimeData;
  verdict: {
    recommended_regime: string;
    tax_saving: number;
    saving_percentage: number;
    reason: string;
  };
  citations: string[];
}

interface RegimeData {
  taxable_income: number;
  total_deductions?: number;
  slab_breakdown: Array<{
    slab: string;
    rate: string;
    tax: number;
  }>;
  base_tax: number;
  cess: number;
  rebate: number;
  total_tax: number;
}

const RegimeCard = ({
  title,
  badge,
  data,
  isRecommended,
  recommendedColor,
}: {
  title: string;
  badge: string;
  data: RegimeData;
  isRecommended: boolean;
  recommendedColor: 'amber' | 'emerald';
}) => {
  const [slabsOpen, setSlabsOpen] = useState(false);

  const borderColor =
    recommendedColor === 'amber'
      ? 'border-amber-500'
      : 'border-emerald-500';
  const badgeColor =
    recommendedColor === 'amber'
      ? 'bg-amber-950 text-amber-400 border-amber-700'
      : 'bg-emerald-950 text-emerald-400 border-emerald-700';

  return (
    <Card
      className={cn(
        'bg-slate-900 border-slate-700',
        isRecommended && `border-2 ${borderColor}`
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className={`text-xs px-2 py-1 rounded-full border ${badgeColor}`}>
            {isRecommended ? '✓ Recommended' : badge}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Row: Gross Income */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Gross Income</span>
          <span className="font-mono text-slate-100">
            {formatCurrency(data.taxable_income + (data.total_deductions || 0))}
          </span>
        </div>

        {/* Row: Total Deductions */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Total Deductions</span>
          <span className="font-mono text-red-400">
            −{formatCurrency(data.total_deductions || 0)}
          </span>
        </div>

        <div className="border-t border-slate-700" />

        {/* Row: Taxable Income */}
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="text-slate-300">Taxable Income</span>
          <span className="font-mono text-slate-100">
            {formatCurrency(data.taxable_income)}
          </span>
        </div>

        {/* Collapsible: Slab Breakdown */}
        <button
          onClick={() => setSlabsOpen(!slabsOpen)}
          className="w-full flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 mt-3 transition-colors"
        >
          <ChevronDown
            size={14}
            className={cn('transition-transform', slabsOpen && 'rotate-180')}
          />
          Slab Breakdown
        </button>

        {slabsOpen && (
          <div className="bg-slate-800/50 rounded-lg p-3 text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-500 pb-2">Range</th>
                  <th className="text-right text-slate-500 pb-2">Rate</th>
                  <th className="text-right text-slate-500 pb-2">Tax</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-300">
                {data.slab_breakdown.map((slab, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-700 last:border-b-0"
                  >
                    <td className="py-1.5">{slab.slab}</td>
                    <td className="text-right">{slab.rate}</td>
                    <td className="text-right">{formatCurrency(slab.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-700" />

        {/* Tax Components */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Base Tax</span>
          <span className="font-mono text-slate-100">
            {formatCurrency(data.base_tax)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Health & Education Cess (4%)</span>
          <span className="font-mono text-slate-100">
            {formatCurrency(data.cess)}
          </span>
        </div>

        {data.rebate > 0 && (
          <div className="bg-emerald-950/50 border border-emerald-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={14} />
              <span>Rebate u/s 87A applied → ₹0 Tax</span>
            </div>
          </div>
        )}

        <div className="border-t border-slate-700" />

        {/* Total Tax */}
        <div className="flex justify-between items-center">
          <span className="text-slate-300 font-semibold">Total Tax Payable</span>
          <span className="font-mono text-xl font-bold text-red-400">
            {formatCurrency(data.total_tax)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export const RegimeCalculator: React.FC = () => {
  const { documentExtractedData, setDocumentExtractedData } = useAppStore();
  const [activeMode, setActiveMode] = useState<'regime' | 'capital'>('regime');
  const [documentUsed, setDocumentUsed] = useState(false);

  const [grossIncome, setGrossIncome] = useState('');
  const [sec80c, setSec80c] = useState('');
  const [sec80d, setSec80d] = useState('');
  const [hraExemption, setHraExemption] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');

  const [capitalProjectName, setCapitalProjectName] = useState('');
  const [capitalInitialInvestment, setCapitalInitialInvestment] = useState('');
  const [capitalCashFlows, setCapitalCashFlows] = useState('');
  const [capitalDiscountRate, setCapitalDiscountRate] = useState('');
  const [capitalCurrency, setCapitalCurrency] = useState<'INR' | 'USD'>('INR');

  const [result, setResult] = useState<RegimeOutput | null>(null);
  const [capitalResult, setCapitalResult] = useState<CapitalBudgetOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Pre-fill form with extracted document data
  useEffect(() => {
    if (documentExtractedData && !documentUsed) {
      const data = documentExtractedData;
      
      // Map extracted fields to form fields
      if (data.gross_salary) {
        setGrossIncome(String(data.gross_salary));
      }
      if (data.tds_deducted) {
        setOtherDeductions(String(data.tds_deducted));
      }
      if (data.pf) {
        setSec80c(String(data.pf));
      }
      
      setDocumentUsed(true);
    }
  }, [documentExtractedData, documentUsed]);

  const handleCalculate = async () => {
    if (!grossIncome) {
      setError('Gross Annual Income is required');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const input = {
        gross_income: parseFloat(grossIncome),
        sec_80c: parseFloat(sec80c) || 0,
        sec_80d: parseFloat(sec80d) || 0,
        hra_exemption: parseFloat(hraExemption) || 0,
        other_deductions: parseFloat(otherDeductions) || 0,
      };

      const response = await compareRegimeAPI(input);
      setResult(response);
    } catch (err) {
      setError('Failed to calculate. Please try again.');
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setGrossIncome('');
    setSec80c('');
    setSec80d('');
    setHraExemption('');
    setOtherDeductions('');
    setCapitalResult(null);
    setCapitalProjectName('');
    setCapitalInitialInvestment('');
    setCapitalCashFlows('');
    setCapitalDiscountRate('');
    setCapitalCurrency('INR');
    setDocumentUsed(false);
    setDocumentExtractedData(null);
  };

  const handleCapitalCalculate = async () => {
    if (!capitalInitialInvestment || Number(capitalInitialInvestment) <= 0) {
      setError('Initial investment must be greater than 0');
      return;
    }

    if (!capitalCashFlows) {
      setError('Enter 1 or more cash flow values separated by commas');
      return;
    }

    const flows = capitalCashFlows
      .split(',')
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !Number.isNaN(v));

    if (!flows.length) {
      setError('Cash flows must be valid numbers');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await evaluateCapitalBudgetAPI({
        project_name: capitalProjectName || undefined,
        initial_investment: Number(capitalInitialInvestment),
        cash_flows: flows,
        discount_rate: Number(capitalDiscountRate || 10),
        currency: capitalCurrency,
      });
      setCapitalResult(response);
      setResult(null);
    } catch (err) {
      setError('Failed to calculate capital budgeting. Please try again.');
      console.error('Capital budgeting error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sec80cWarning =
    sec80c && parseFloat(sec80c) > 150000
      ? 'Capped at ₹1,50,000 by law'
      : null;

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6">
      <div className="max-w-5xl mx-auto mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMode('regime')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold',
              activeMode === 'regime'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            Tax Regime Comparison
          </button>
          <button
            onClick={() => setActiveMode('capital')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold',
              activeMode === 'capital'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            Capital Budgeting
          </button>
        </div>
      </div>

      {/* Document Data Banner */}
      {documentUsed && documentExtractedData && (
        <div className="max-w-5xl mx-auto mb-4">
          <div className="bg-violet-950/50 border border-violet-700 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-violet-400" />
              <div>
                <p className="font-semibold text-slate-100">Document Data Imported</p>
                <p className="text-sm text-slate-300">Values extracted from your uploaded document are pre-filled above</p>
              </div>
            </div>
            <button
              onClick={() => {
                setDocumentUsed(false);
                setDocumentExtractedData(null);
              }}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto flex gap-6">
        {/* Left Panel - Input */}
        <div className="w-96 flex-shrink-0">
          <div className="sticky top-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calculator className="text-teal-400" />
                  <div>
                    <CardTitle>Regime Comparison</CardTitle>
                    <p className="text-xs text-teal-400">
                      FY 2024–25 · CBDT Slabs
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {error && (
                  <div className="bg-red-950/50 border border-red-700/50 rounded-lg p-3 flex gap-3">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {activeMode === 'regime' ? (
                  <>
                    {/* Gross Annual Income */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Gross Annual Income (₹) *
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 900000"
                        value={grossIncome}
                        onChange={(e) => setGrossIncome(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Include salary, freelance, rental income
                      </p>
                    </div>

                    {/* Section 80C */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Section 80C Investments (₹)
                      </label>
                      <Input
                        type="number"
                        placeholder="Max ₹1,50,000"
                        value={sec80c}
                        onChange={(e) => setSec80c(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        ELSS, PPF, LIC, PF contributions
                      </p>
                      {sec80cWarning && (
                        <p className="text-xs text-amber-400 mt-2">⚠ {sec80cWarning}</p>
                      )}
                    </div>

                    {/* HRA Exemption */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        HRA Exemption (₹)
                      </label>
                      <Input
                        type="number"
                        placeholder="0 if not applicable"
                        value={hraExemption}
                        onChange={(e) => setHraExemption(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Only applicable in Old Regime
                      </p>
                    </div>

                    {/* Other Deductions */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Other Deductions (₹)
                      </label>
                      <Input
                        type="number"
                        placeholder="80D, 80E, 80G, etc."
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Health insurance, education loan, donations
                      </p>
                    </div>

                    {/* Advanced Section */}
                    <button
                      onClick={() => setAdvancedOpen(!advancedOpen)}
                      className="w-full flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300"
                    >
                      <ChevronDown
                        size={16}
                        className={cn('transition-transform', advancedOpen && 'rotate-180')}
                      />
                      Advanced
                    </button>

                    {advancedOpen && (
                      <div className="border-t border-slate-700 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-300">
                              Standard Deduction
                            </label>
                            <Info size={14} className="text-slate-500" />
                          </div>
                          <input
                            type="text"
                            value="₹75,000"
                            disabled
                            className="w-24 text-right text-slate-400 bg-transparent text-sm"
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          Old: ₹50,000 | New: ₹75,000
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            NPS 80CCD(1B) (₹)
                          </label>
                          <Input
                            type="number"
                            placeholder="Max ₹50,000"
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleCalculate}
                      disabled={loading}
                      className="w-full bg-teal-600 hover:bg-teal-700 py-3"
                    >
                      {loading ? 'Calculating...' : 'Calculate & Compare →'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Project Name (Optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="Project Alpha"
                        value={capitalProjectName}
                        onChange={(e) => setCapitalProjectName(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Initial Investment (₹)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 1500000"
                        value={capitalInitialInvestment}
                        onChange={(e) => setCapitalInitialInvestment(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Capital outlay before cash inflows start
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Cash Flows (comma-separated ₹)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. 400000,500000,600000"
                        value={capitalCashFlows}
                        onChange={(e) => setCapitalCashFlows(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Enter post-tax project cash inflows per period
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Discount Rate (%)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 10"
                        value={capitalDiscountRate}
                        onChange={(e) => setCapitalDiscountRate(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Cost of capital or required return rate
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={capitalCurrency}
                        onChange={(e) => setCapitalCurrency(e.target.value as 'INR' | 'USD')}
                        className="w-full bg-slate-800 border-slate-700 px-3 py-2 rounded"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        Set unit for interpretation / reports
                      </p>
                    </div>

                    <Button
                      onClick={handleCapitalCalculate}
                      disabled={loading}
                      className="w-full bg-teal-600 hover:bg-teal-700 py-3"
                    >
                      {loading ? 'Calculating...' : 'Evaluate Capital Budget →'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Results */}
        {activeMode === 'regime' && result && (
          <div className="flex-1 space-y-4 animate-in slide-in-from-right-12 fade-in duration-300">
            {/* Verdict Banner */}
            <Card
              className={cn(
                'border-l-4',
                result.verdict.recommended_regime === 'New Regime'
                  ? 'bg-emerald-950/50 border-emerald-700 border-l-emerald-500'
                  : 'bg-amber-950/50 border-amber-700 border-l-amber-500'
              )}
            >
              <CardContent className="pt-6 flex items-start gap-4">
                {result.verdict.recommended_regime === 'New Regime' ? (
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
                ) : (
                  <TrendingDown className="text-amber-400 flex-shrink-0 mt-1" size={24} />
                )}
                <div>
                  <h3 className="font-semibold text-lg text-slate-50">
                    {result.verdict.recommended_regime} Recommended
                  </h3>
                  <p className="text-slate-300 mt-1">
                    You save{' '}
                    <span className="font-mono font-bold text-teal-400">
                      {formatCurrency(result.verdict.tax_saving)}
                    </span>{' '}
                    by choosing the {result.verdict.recommended_regime}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Based on your inputs for FY 2024-25
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Two Regime Cards */}
            <div className="grid grid-cols-2 gap-4">
              <RegimeCard
                title="Old Tax Regime"
                badge="With Deductions"
                data={result.old_regime}
                isRecommended={
                  result.verdict.recommended_regime === 'Old Regime'
                }
                recommendedColor="amber"
              />
              <RegimeCard
                title="New Tax Regime"
                badge="Simplified"
                data={result.new_regime}
                isRecommended={
                  result.verdict.recommended_regime === 'New Regime'
                }
                recommendedColor="emerald"
              />
            </div>

            {/* Insight Row */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-xs text-slate-400 mb-2">Effective Tax Rate</p>
                  <p className="font-mono text-lg font-bold text-slate-100">
                    {(
                      (result.old_regime.total_tax /
                        (result.old_regime.taxable_income +
                          (result.old_regime.total_deductions || 0))) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Old Regime</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-xs text-slate-400 mb-2">Effective Tax Rate</p>
                  <p className="font-mono text-lg font-bold text-slate-100">
                    {(
                      (result.new_regime.total_tax /
                        (result.new_regime.taxable_income +
                          (result.new_regime.total_deductions || 0))) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-xs text-slate-500 mt-1">New Regime</p>
                </CardContent>
              </Card>
              <Card className="bg-teal-950/50 border-teal-700">
                <CardContent className="pt-6">
                  <p className="text-xs text-teal-400 mb-2">Total Saving</p>
                  <p className="font-mono text-lg font-bold text-teal-300">
                    {formatCurrency(result.verdict.tax_saving)}
                  </p>
                  <p className="text-xs text-teal-400 mt-1">
                    {result.verdict.saving_percentage.toFixed(1)}% savings
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Legal Footnote */}
            <p className="text-xs text-slate-500 mt-6">
              Computed using CBDT notified slabs for AY 2025-26. Includes 4%
              health & education cess. 87A rebate applied where applicable.
              <span className="text-teal-400 font-medium ml-1">§115BAC</span>
            </p>

            {/* Reset Button */}
            <Button
              onClick={handleReset}
              variant="secondary"
              className="w-full"
            >
              Calculate Another
            </Button>
          </div>
        )}

        {activeMode === 'capital' && capitalResult && (
          <div className="flex-1 space-y-4 animate-in slide-in-from-right-12 fade-in duration-300">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Capital Budgeting Result</CardTitle>
                <p className="text-xs text-slate-400">
                  Project: {capitalResult.project_name ?? 'Unnamed'} ({capitalResult.currency})
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">NPV</p>
                    <p className="font-mono text-xl font-bold">
                      {capitalResult.currency === 'INR' ? '₹' : '$'}{capitalResult.npv.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Net present value: discounted profit in today’s currency.
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">IRR</p>
                    <p className="font-mono text-xl font-bold">{capitalResult.irr?.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Internal rate of return: expected yield per year.
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">Payback Period</p>
                    <p className="font-mono text-xl font-bold">{capitalResult.payback_period?.toFixed(2)} years</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Time to recover the upfront investment.
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">Profitability Index</p>
                    <p className="font-mono text-xl font-bold">{capitalResult.profitability_index?.toFixed(3)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      PV inflows / investment; {'>'}1 means value creation.
                    </p>
                  </div>
                </div>

                <div className="bg-teal-950/60 border border-teal-700 rounded-lg p-3">
                  <p className="text-xs text-teal-300">Recommendation</p>
                  <p className="font-medium text-slate-100">{capitalResult.recommendation}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Based on NPV & IRR comparison with discount rate.
                  </p>
                </div>

                <Button onClick={handleReset} variant="secondary" className="w-full">
                  New Capital Budget Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

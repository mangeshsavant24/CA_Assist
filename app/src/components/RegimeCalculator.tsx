// MODIFIED: 2026-03-28 — layout restructure
// Changed: Removed capital budgeting tab entirely (now standalone CapitalBudgeting.tsx),
//          Applied two-panel layout (left inputs w-[420px], right results flex-1),
//          Page title row above two-panel
// Preserved: All regime calculation logic, compareRegimeAPI call, RegimeCard component,
//            autofill from document data, advanced toggle, all existing colors and output internals

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
import { compareRegimeAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/appStore';

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
  slab_breakdown: Array<{ slab: string; rate: string; tax: number }>;
  base_tax: number;
  cess: number;
  rebate: number;
  total_tax: number;
}

const FormattedInput = ({ value, onChange, placeholder, className, disabled = false }: any) => {
  const displayValue = value ? new Intl.NumberFormat('en-IN').format(Number(value)) : '';
  const handleChange = (e: any) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(raw)) onChange(raw);
  };
  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn('bg-white/5 border-white/10 font-mono tracking-wide text-white focus:border-[#10b981]/50 focus:ring-[#10b981]/20 transition-all', className)}
      disabled={disabled}
    />
  );
};

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
  const borderColor = recommendedColor === 'amber' ? 'border-amber-500' : 'border-emerald-500';
  const badgeColor = recommendedColor === 'amber'
    ? 'bg-amber-950 text-amber-400 border-amber-700'
    : 'bg-emerald-950 text-emerald-400 border-emerald-700';

  return (
    <Card className={cn('bg-[#0a0a0a] border-[#1f2937]', isRecommended && `border-2 ${borderColor}`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className={`text-xs px-2 py-1 rounded-full border ${badgeColor}`}>
            {isRecommended ? '✓ Recommended' : badge}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#a1a1aa]">Gross Income</span>
          <span className="font-mono text-slate-100">{formatCurrency(data.taxable_income + (data.total_deductions || 0))}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#a1a1aa]">Total Deductions</span>
          <span className="font-mono text-red-400">−{formatCurrency(data.total_deductions || 0)}</span>
        </div>
        <div className="border-t border-slate-700" />
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="text-slate-300">Taxable Income</span>
          <span className="font-mono text-slate-100">{formatCurrency(data.taxable_income)}</span>
        </div>
        <button
          onClick={() => setSlabsOpen(!slabsOpen)}
          className="w-full flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 mt-3 transition-colors"
        >
          <ChevronDown size={14} className={cn('transition-transform', slabsOpen && 'rotate-180')} />
          Slab Breakdown
        </button>
        {slabsOpen && (
          <div className="bg-white/5 rounded-lg p-3 text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  <th className="text-left text-slate-400 pb-2">Range</th>
                  <th className="text-right text-slate-400 pb-2">Rate</th>
                  <th className="text-right text-slate-400 pb-2">Tax</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-300">
                {data.slab_breakdown.map((slab, idx) => (
                  <tr key={idx} className="border-b border-[#1f2937] last:border-b-0">
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
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#a1a1aa]">Base Tax</span>
          <span className="font-mono text-slate-100">{formatCurrency(data.base_tax)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#a1a1aa]">Health & Education Cess (4%)</span>
          <span className="font-mono text-slate-100">{formatCurrency(data.cess)}</span>
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
        <div className="flex justify-between items-center">
          <span className="text-slate-300 font-semibold">Total Tax Payable</span>
          <span className="font-mono text-xl font-bold text-red-400">{formatCurrency(data.total_tax)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const RegimeCalculator: React.FC = () => {
  const { documentExtractedData, setDocumentExtractedData } = useAppStore();
  const [documentUsed, setDocumentUsed] = useState(false);

  const [grossIncome, setGrossIncome] = useState('');
  const [sec80c, setSec80c] = useState('');
  const [sec80d, setSec80d] = useState('');
  const [hraExemption, setHraExemption] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');

  const [result, setResult] = useState<RegimeOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Pre-fill from document data
  useEffect(() => {
    if (documentExtractedData && !documentUsed) {
      const data = documentExtractedData;
      if (data.gross_salary) setGrossIncome(String(data.gross_salary));
      if (data.tds_deducted) setOtherDeductions(String(data.tds_deducted));
      if (data.sec80c || data.pf) setSec80c(String(data.sec80c || data.pf));
      if (data.hra_exemption) setHraExemption(String(data.hra_exemption));
      if (data.sec80d) setSec80d(String(data.sec80d));
      setDocumentUsed(true);
    }
  }, [documentExtractedData, documentUsed]);

  const handleCalculate = async () => {
    if (!grossIncome) { setError('Gross Annual Income is required'); return; }
    setError(null);
    setLoading(true);
    try {
      const response = await compareRegimeAPI({
        gross_income: parseFloat(grossIncome),
        sec_80c: parseFloat(sec80c) || 0,
        sec_80d: parseFloat(sec80d) || 0,
        hra_exemption: parseFloat(hraExemption) || 0,
        other_deductions: parseFloat(otherDeductions) || 0,
      });
      setResult(response);
    } catch {
      setError('Failed to calculate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setGrossIncome(''); setSec80c(''); setSec80d(''); setHraExemption(''); setOtherDeductions('');
    setDocumentUsed(false);
    setDocumentExtractedData(null);
  };

  const sec80cWarning = sec80c && parseFloat(sec80c) > 150000 ? 'Capped at ₹1,50,000 by law' : null;

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Calculator className="text-[#10b981]" size={30} />
          Regime Calculator
        </h1>
        <p className="text-[#a1a1aa] mt-1 ml-11 text-sm">Compare old vs new tax regime for FY 2024–25</p>
      </div>

      {/* Document autofill banner */}
      {documentUsed && documentExtractedData && (
        <div className="mb-4 bg-violet-950/50 border border-violet-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-violet-400" />
            <div>
              <p className="font-semibold text-slate-100">Document Data Imported</p>
              <p className="text-sm text-slate-300">Values extracted from your uploaded document are pre-filled</p>
            </div>
          </div>
          <button
            onClick={() => { setDocumentUsed(false); setDocumentExtractedData(null); }}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex gap-6 items-start">

        {/* LEFT PANEL — Inputs */}
        <div className="w-[420px] flex-shrink-0">
          <div className="sticky top-6">
            <Card className="bg-[#0a0a0a] border-[#1f2937]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calculator className="text-[#10b981]" size={20} />
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Regime Comparison</CardTitle>
                    <p className="text-xs text-[#10b981] mt-0.5">FY 2024–25 · CBDT Slabs</p>
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

                {/* 2-col input grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Gross Annual Income (₹) *</label>
                    <FormattedInput placeholder="e.g. 9,00,000" value={grossIncome} onChange={setGrossIncome} />
                    <p className="text-xs text-[#a1a1aa] mt-1">Include salary, freelance, rental income</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Section 80C (₹)</label>
                    <FormattedInput placeholder="Max ₹1,50,000" value={sec80c} onChange={setSec80c} />
                    <p className="text-xs text-[#a1a1aa] mt-1">ELSS, PPF, LIC, PF</p>
                    {sec80cWarning && <p className="text-xs text-amber-400 mt-1">⚠ {sec80cWarning}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">HRA Exemption (₹)</label>
                    <FormattedInput placeholder="0 if N/A" value={hraExemption} onChange={setHraExemption} />
                    <p className="text-xs text-[#a1a1aa] mt-1">Old Regime only</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Other Deductions (₹)</label>
                    <FormattedInput placeholder="80D, 80E, 80G, etc." value={otherDeductions} onChange={setOtherDeductions} />
                    <p className="text-xs text-[#a1a1aa] mt-1">Health insurance, education loan, donations</p>
                  </div>
                </div>

                {/* Advanced toggle */}
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full flex items-center gap-2 text-sm text-[#10b981]"
                >
                  <ChevronDown size={16} className={cn('transition-transform', advancedOpen && 'rotate-180')} />
                  Advanced
                </button>

                {advancedOpen && (
                  <div className="border-t border-[#1f2937] pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-300">Standard Deduction</label>
                        <div className="group relative flex items-center">
                          <Info size={14} className="text-slate-500 hover:text-[#10b981] cursor-help transition-colors" />
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-white/10 text-xs text-slate-300 leading-relaxed rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 border border-white/10">
                            Automatically applied to all salaried income under both regimes.
                          </div>
                        </div>
                      </div>
                      <input type="text" value="₹75,000" disabled className="w-24 text-right text-[#a1a1aa] bg-transparent text-sm" />
                    </div>
                    <p className="text-xs text-[#a1a1aa]">Old: ₹50,000 | New: ₹75,000</p>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">NPS 80CCD(1B) (₹)</label>
                      <Input type="number" placeholder="Max ₹50,000" className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-3 mt-5"
                >
                  {loading ? 'Calculating...' : 'Calculate & Compare →'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT PANEL — Results */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="space-y-4 animate-in fade-in">
              <div className="h-[100px] bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-[380px] bg-slate-900 border border-slate-800 rounded-xl animate-pulse delay-75" />
                <div className="h-[380px] bg-slate-900 border border-slate-800 rounded-xl animate-pulse delay-100" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[140px] bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {!loading && !result && (
            <div
              className="rounded-2xl border border-dashed flex flex-col items-center justify-center text-center p-16 min-h-[400px]"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(10,10,12,0.4)' }}
            >
              <Calculator size={48} className="text-[#10b981] opacity-20 mb-4" />
              <p className="text-slate-400 text-sm">Results will appear here</p>
              <p className="text-xs text-slate-600 mt-2">Enter income details and click Calculate</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4" style={{ animation: 'resultFadeIn 300ms ease-out' }}>
              {/* Verdict banner */}
              <Card className={cn(
                'border-l-4',
                result.verdict.recommended_regime === 'New Regime'
                  ? 'bg-emerald-950/50 border-emerald-700 border-l-emerald-500'
                  : 'bg-amber-950/50 border-amber-700 border-l-amber-500'
              )}>
                <CardContent className="pt-6 flex items-start gap-4">
                  {result.verdict.recommended_regime === 'New Regime' ? (
                    <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
                  ) : (
                    <TrendingDown className="text-amber-400 flex-shrink-0 mt-1" size={24} />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-slate-50">{result.verdict.recommended_regime} Recommended</h3>
                    <p className="text-slate-300 mt-1">
                      You save{' '}
                      <span className="font-mono font-bold text-teal-400">{formatCurrency(result.verdict.tax_saving)}</span>{' '}
                      by choosing the {result.verdict.recommended_regime}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Based on your inputs for FY 2024-25</p>
                  </div>
                </CardContent>
              </Card>

              {/* Two regime cards */}
              <div className="grid grid-cols-2 gap-4">
                <RegimeCard
                  title="Old Tax Regime" badge="With Deductions"
                  data={result.old_regime}
                  isRecommended={result.verdict.recommended_regime === 'Old Regime'}
                  recommendedColor="amber"
                />
                <RegimeCard
                  title="New Tax Regime" badge="Simplified"
                  data={result.new_regime}
                  isRecommended={result.verdict.recommended_regime === 'New Regime'}
                  recommendedColor="emerald"
                />
              </div>

              {/* Insight row */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="pt-6">
                    <p className="text-xs text-slate-400 mb-2">Effective Tax Rate (Old)</p>
                    <p className="font-mono text-lg font-bold text-slate-100">
                      {((result.old_regime.total_tax / (result.old_regime.taxable_income + (result.old_regime.total_deductions || 0))) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="pt-6">
                    <p className="text-xs text-slate-400 mb-2">Effective Tax Rate (New)</p>
                    <p className="font-mono text-lg font-bold text-slate-100">
                      {((result.new_regime.total_tax / (result.new_regime.taxable_income + (result.new_regime.total_deductions || 0))) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-teal-950/50 border-teal-700">
                  <CardContent className="pt-6">
                    <p className="text-xs text-teal-400 mb-2">Total Saving</p>
                    <p className="font-mono text-lg font-bold text-teal-300">{formatCurrency(result.verdict.tax_saving)}</p>
                    <p className="text-xs text-teal-400 mt-1">{result.verdict.saving_percentage.toFixed(1)}% savings</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bar chart */}
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <CardContent className="pt-5 relative">
                  <p className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-wider flex items-center justify-between">
                    <span>Liability Comparison Chart</span>
                    <span className="text-teal-400 opacity-60 font-mono tracking-tight">Visualized</span>
                  </p>
                  <div className="flex items-end gap-10 md:gap-16 h-24 px-4 md:px-8 border-b border-slate-800 pb-0">
                    <div
                      className="w-1/2 bg-amber-500/20 rounded-t border-t border-amber-500/50 relative group transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-amber-500/30"
                      style={{ height: `${Math.max(10, (result.old_regime.total_tax / Math.max(result.old_regime.total_tax, result.new_regime.total_tax || 1)) * 100)}%` }}
                    >
                      <div className="absolute -top-7 left-0 right-0 text-center text-xs font-mono font-bold text-amber-500">
                        {formatCurrency(result.old_regime.total_tax)}
                      </div>
                    </div>
                    <div
                      className="w-1/2 bg-emerald-500/20 rounded-t border-t border-emerald-500/50 relative group transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-emerald-500/30 delay-100"
                      style={{ height: `${Math.max(10, (result.new_regime.total_tax / Math.max(result.old_regime.total_tax, result.new_regime.total_tax || 1)) * 100)}%` }}
                    >
                      <div className="absolute -top-7 left-0 right-0 text-center text-xs font-mono font-bold text-emerald-500">
                        {formatCurrency(result.new_regime.total_tax)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between px-4 md:px-8 pt-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <div className="w-1/2 text-center text-amber-500/80">Old Regime</div>
                    <div className="w-1/2 text-center text-emerald-500/80">New Regime</div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-[10px] md:text-xs text-slate-500 mt-6 leading-relaxed">
                Computed using CBDT notified slabs for AY 2025-26. Includes 4% health & education cess. 87A rebate applied where applicable.
                <span className="text-teal-400 font-medium ml-1">§115BAC</span>
              </p>

              <Button onClick={handleReset} variant="secondary" className="w-full">
                Calculate Another
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes resultFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

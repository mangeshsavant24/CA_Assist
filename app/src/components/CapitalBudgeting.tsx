// MODIFIED: 2026-03-28 — layout restructure
// Changed: Extracted from RegimeCalculator.tsx as standalone page; applied two-panel layout
// Preserved: All capital budgeting logic, evaluateCapitalBudgetAPI call, all existing output internals

import React, { useState } from 'react';
import { TrendingUp, ChevronDown, AlertCircle, CheckCircle2, XCircle, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { evaluateCapitalBudgetAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

interface CapitalBudgetOutput {
  project_name?: string;
  currency: 'INR' | 'USD';
  npv: number;
  irr?: number;
  payback_period?: number;
  profitability_index?: number;
  recommendation: string;
}

const FormattedInput = ({ value, onChange, placeholder, className }: any) => {
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
    />
  );
};

export const CapitalBudgeting: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [initialInvestment, setInitialInvestment] = useState('');
  const [cashFlows, setCashFlows] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [result, setResult] = useState<CapitalBudgetOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleCalculate = async () => {
    if (!initialInvestment || Number(initialInvestment) <= 0) {
      setError('Initial investment must be greater than 0');
      return;
    }
    if (!cashFlows) {
      setError('Enter 1 or more cash flow values separated by commas');
      return;
    }
    const flows = cashFlows.split(',').map((v) => parseFloat(v.trim())).filter((v) => !Number.isNaN(v));
    if (!flows.length) {
      setError('Cash flows must be valid numbers');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await evaluateCapitalBudgetAPI({
        project_name: projectName || undefined,
        initial_investment: Number(initialInvestment),
        cash_flows: flows,
        discount_rate: Number(discountRate || 10),
        currency,
      });
      setResult(response);
    } catch {
      setError('Failed to calculate capital budgeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setProjectName('');
    setInitialInvestment('');
    setCashFlows('');
    setDiscountRate('');
    setCurrency('INR');
    setError(null);
  };

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <TrendingUp className="text-[#10b981]" size={30} />
          Capital Budgeting
        </h1>
        <p className="text-[#a1a1aa] mt-1 ml-11 text-sm">Evaluate investment viability with NPV, IRR &amp; Payback Period</p>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-6 items-start">

        {/* LEFT PANEL — Inputs */}
        <div className="w-[420px] flex-shrink-0">
          <Card className="bg-[#0a0a0a] border-[#1f2937]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="text-[#10b981]" size={20} />
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Capital Budgeting</CardTitle>
                  <p className="text-xs text-[#10b981] mt-0.5">Project Evaluation Metrics</p>
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
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Project Name (Optional)</label>
                  <Input
                    type="text"
                    placeholder="Project Alpha"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Initial Investment (₹/$ )</label>
                  <FormattedInput
                    placeholder="e.g. 15,00,000"
                    value={initialInvestment}
                    onChange={setInitialInvestment}
                  />
                  <p className="text-xs text-[#a1a1aa] mt-1">Capital outlay before cash inflows</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Discount Rate (%)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-[#a1a1aa] mt-1">Cost of capital or required return</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                  >
                    <option className="bg-slate-900" value="INR">INR (₹)</option>
                    <option className="bg-slate-900" value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Advanced: Cash Flows */}
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="w-full flex items-center gap-2 text-sm text-[#10b981] hover:text-[#10b981]"
              >
                <ChevronDown size={16} className={cn('transition-transform', advancedOpen && 'rotate-180')} />
                Cash Flows (required)
              </button>

              {advancedOpen && (
                <div className="border-t border-[#1f2937] pt-4">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Cash Flows (comma-separated)</label>
                  <Input
                    type="text"
                    placeholder="e.g. 400000,500000,600000"
                    value={cashFlows}
                    onChange={(e) => setCashFlows(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-[#a1a1aa] mt-1">Enter post-tax project cash inflows per period</p>
                </div>
              )}

              {!advancedOpen && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Cash Flows (comma-separated)</label>
                  <Input
                    type="text"
                    placeholder="e.g. 400000,500000,600000"
                    value={cashFlows}
                    onChange={(e) => setCashFlows(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-[#a1a1aa] mt-1">Enter post-tax project cash inflows per period</p>
                </div>
              )}

              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-3 mt-5"
              >
                {loading ? 'Calculating...' : 'Evaluate Capital Budget →'}
              </Button>

              {result && (
                <Button onClick={handleReset} variant="secondary" className="w-full">
                  Reset
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL — Results */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="space-y-4 animate-in fade-in">
              {[200, 300, 150].map((h, i) => (
                <div key={i} className={`h-[${h}px] bg-slate-900 border border-slate-800 rounded-xl animate-pulse`} style={{ height: h }} />
              ))}
            </div>
          )}

          {!loading && !result && (
            <div
              className="rounded-2xl border border-dashed flex flex-col items-center justify-center text-center p-16 min-h-[400px]"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(10,10,12,0.4)' }}
            >
              <TrendingUp size={48} className="text-[#10b981] opacity-20 mb-4" />
              <p className="text-slate-400 text-sm">Results will appear here</p>
              <p className="text-xs text-slate-600 mt-2">Enter your project details and click Evaluate</p>
            </div>
          )}

          {!loading && result && (
            <div
              className="space-y-4"
              style={{
                animation: 'resultFadeIn 300ms ease-out',
              }}
            >
              {/* Verdict banner */}
              <Card className={cn('border-l-4', result.npv >= 0 ? 'bg-emerald-950/50 border-emerald-700 border-l-emerald-500' : 'bg-red-950/50 border-red-700 border-l-red-500')}>
                <CardContent className="pt-6 flex items-start gap-4">
                  {result.npv >= 0 ? (
                    <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
                  ) : (
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-slate-50">
                      {result.npv >= 0 ? 'Investment is Viable' : 'Investment May Not Be Viable'}
                    </h3>
                    <p className="text-slate-300 mt-1 text-sm">{result.recommendation}</p>
                    {result.project_name && (
                      <p className="text-xs text-slate-400 mt-2">Project: {result.project_name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="pt-6">
                    <p className="text-xs text-slate-400 mb-2">Net Present Value (NPV)</p>
                    <p className={cn('font-mono text-lg font-bold', result.npv >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {result.npv >= 0 ? '+' : ''}{formatCurrency(result.npv)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{result.currency}</p>
                  </CardContent>
                </Card>

                {result.irr != null && (
                  <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-xs text-slate-400 mb-2">Internal Rate of Return</p>
                      <p className="font-mono text-lg font-bold text-slate-100">{result.irr.toFixed(2)}%</p>
                      <p className="text-xs text-slate-500 mt-1">IRR</p>
                    </CardContent>
                  </Card>
                )}

                {result.payback_period != null && (
                  <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-xs text-slate-400 mb-2">Payback Period</p>
                      <p className="font-mono text-lg font-bold text-slate-100">{result.payback_period.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-1">years</p>
                    </CardContent>
                  </Card>
                )}

                {result.profitability_index != null && (
                  <Card className="bg-teal-950/50 border-teal-700">
                    <CardContent className="pt-6">
                      <p className="text-xs text-teal-400 mb-2">Profitability Index</p>
                      <p className="font-mono text-lg font-bold text-teal-300">{result.profitability_index.toFixed(3)}</p>
                      <p className="text-xs text-teal-500 mt-1">PI {'>'} 1 = Accept</p>
                    </CardContent>
                  </Card>
                )}
              </div>
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

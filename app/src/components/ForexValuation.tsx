import React, { useState } from 'react';
import { DollarSign, RefreshCw, TrendingUp, ShieldAlert, Plus, Trash2, Calendar, FileText, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { evaluateForexAPI, ForexExposureNew, ForexValuationInputNew, ForexValuationOutputNew } from '../lib/api';

export const ForexValuation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForexValuationOutputNew | null>(null);

  // Global Inputs
  const [valuationDate, setValuationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [baseCurrency, setBaseCurrency] = useState<string>('INR');

  // List of exposures
  const [exposures, setExposures] = useState<ForexExposureNew[]>([]);

  // Current Input Form
  const [currentExposure, setCurrentExposure] = useState<Partial<ForexExposureNew>>({
    currency_pair: 'USD/INR',
    exposure_type: 'Receivable',
    foreign_amount: 0,
    initial_rate: 0,
    current_rate: 0,
    description: ''
  });

  const handleAddExposure = () => {
    if (!currentExposure.currency_pair || !currentExposure.foreign_amount || !currentExposure.initial_rate || !currentExposure.current_rate) {
       setError("Please fill all required exposure fields before adding.");
       return;
    }
    const newExposure: ForexExposureNew = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      currency_pair: currentExposure.currency_pair,
      exposure_type: currentExposure.exposure_type as 'Receivable' | 'Payable',
      foreign_amount: Number(currentExposure.foreign_amount),
      initial_rate: Number(currentExposure.initial_rate),
      current_rate: Number(currentExposure.current_rate),
      description: currentExposure.description || ''
    };
    
    setExposures([...exposures, newExposure]);
    setCurrentExposure({
      ...currentExposure,
      foreign_amount: 0,
      initial_rate: 0,
      current_rate: 0,
      description: ''
    });
    setError(null);
  };

  const removeExposure = (id: string) => {
    setExposures(exposures.filter(e => e.id !== id));
  };

  const handleEvaluate = async () => {
    if (exposures.length === 0) {
      setError("Please add at least one forex exposure to evaluate.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: ForexValuationInputNew = {
        valuation_date: valuationDate,
        base_currency: baseCurrency,
        exposures: exposures
      };
      const res = await evaluateForexAPI(payload);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to evaluate forex valuation.");
      console.error("Forex evaluation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount);
    } catch (e) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20">
            <DollarSign className="text-[#10b981]" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Forex Valuation</h1>
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#10b981]" /> Real-time currency conversion and forward exposure tracking.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <ShieldAlert size={16} />{error}
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* LEFT PANEL — Inputs */}
        <div className="w-[420px] flex-shrink-0 space-y-6">

            
            {/* Portfolio Settings */}
            <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={18} className="text-[#10b981]" />
                  Portfolio Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 tracking-wide flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" /> Valuation Date
                  </label>
                  <Input 
                    type="date" 
                    value={valuationDate}
                    onChange={(e) => setValuationDate(e.target.value)}
                    className="bg-[#111111] border-white/10 text-white font-medium pl-4 py-6 cursor-pointer" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 tracking-wide flex items-center gap-2">
                    <DollarSign size={14} className="text-slate-500" /> Base Currency
                  </label>
                  <select 
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 text-white rounded-lg p-3 font-medium outline-none focus:border-[#10b981]/50 focus:ring-1 focus:ring-[#10b981]/50 transition-all cursor-pointer h-[50px]">
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Add Exposure Form */}
            <Card className="bg-slate-900/50 backdrop-blur border border-white/5 shadow-inner">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[#10b981]">Add Exposure Position</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Currency Pair (e.g. USD/INR)</label>
                    <Input 
                      type="text" 
                      placeholder="USD/INR"
                      value={currentExposure.currency_pair}
                      onChange={(e) => setCurrentExposure({...currentExposure, currency_pair: e.target.value.toUpperCase()})}
                      className="bg-[#111111] border-white/10 text-white" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Exposure Type</label>
                    <select 
                      value={currentExposure.exposure_type}
                      onChange={(e) => setCurrentExposure({...currentExposure, exposure_type: e.target.value as any})}
                      className="w-full bg-[#111111] border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-[#10b981]/50 transition-all text-sm h-[42px]">
                      <option value="Receivable">Receivable</option>
                      <option value="Payable">Payable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Foreign Amount</label>
                    <Input 
                      type="number" 
                      placeholder="50000"
                      value={currentExposure.foreign_amount || ''}
                      onChange={(e) => setCurrentExposure({...currentExposure, foreign_amount: parseFloat(e.target.value)})}
                      className="bg-[#111111] border-white/10 text-white font-mono" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description (Opt)</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Acme Corp Invoice"
                      value={currentExposure.description}
                      onChange={(e) => setCurrentExposure({...currentExposure, description: e.target.value})}
                      className="bg-[#111111] border-white/10 text-slate-300" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Initial Rate</label>
                    <Input 
                      type="number" 
                      step="0.0001"
                      placeholder="82.50"
                      value={currentExposure.initial_rate || ''}
                      onChange={(e) => setCurrentExposure({...currentExposure, initial_rate: parseFloat(e.target.value)})}
                      className="bg-[#111111] border-white/10 text-white font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Current/Valuation Rate</label>
                    <Input 
                      type="number" 
                      step="0.0001"
                      placeholder="83.10"
                      value={currentExposure.current_rate || ''}
                      onChange={(e) => setCurrentExposure({...currentExposure, current_rate: parseFloat(e.target.value)})}
                      className="bg-[#111111] border-white/10 text-white font-mono" 
                    />
                  </div>
                  
                </div>

                <Button 
                  onClick={handleAddExposure}
                  variant="outline"
                  className="w-full mt-6 bg-[#111111] hover:bg-white/5 border-white/10 text-[#10b981] font-semibold py-2 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Position to Portfolio
                </Button>

              </CardContent>
            </Card>

            {/* List of Exposures */}
            {exposures.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{exposures.length} Recorded Exposures</h3>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-black font-semibold text-sm py-2 px-6 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02] border-0"
                    onClick={handleEvaluate}
                    disabled={loading}
                  >
                    {loading ? <span className="animate-pulse">Evaluating...</span> : <><RefreshCw size={16} className="mr-2" /> Evaluate</>}
                  </Button>
                </div>
                {exposures.map((exp) => (
                  <div key={exp.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111111]/80 border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors group">
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          {exp.currency_pair}
                        </span>
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${exp.exposure_type === 'Receivable' ? 'text-teal-400 bg-teal-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                          {exp.exposure_type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Amt: <span className="text-slate-200 font-mono">{Intl.NumberFormat('en-US').format(exp.foreign_amount)}</span> | 
                        Rate: <span className="text-slate-200 font-mono">{exp.initial_rate} → {exp.current_rate}</span>
                        {exp.description && ` | ${exp.description}`}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeExposure(exp.id)}
                      className="text-slate-500 hover:text-red-400 bg-black/20 hover:bg-red-400/10 p-2 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

      {/* RIGHT PANEL — Results */}
      <div className="flex-1 min-w-0">
            {result ? (
              <div className="space-y-6 sticky top-6 animate-in slide-in-from-right-8 duration-500">
                <Card className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#10b981]/30 shadow-[0_0_40px_rgba(16,185,129,0.05)] overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-[#10b981] to-emerald-400"></div>
                  <CardHeader className="border-b border-white/5 pb-4 pt-6">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-[#10b981]" />
                      Valuation Results
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1 font-medium">As of {result.valuation_date} in {result.base_currency}</p>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#111111] rounded-xl p-4 border border-white/5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Initial Value</p>
                        <p className="text-lg font-mono text-slate-200">{formatCurrency(result.total_initial_value, result.base_currency)}</p>
                      </div>
                      <div className="bg-[#111111] rounded-xl p-4 border border-white/5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Current Value</p>
                        <p className="text-lg font-mono text-slate-200">{formatCurrency(result.total_current_value, result.base_currency)}</p>
                      </div>
                    </div>

                    <div className={`rounded-xl p-5 border flex flex-col items-center justify-center text-center ${result.net_gain_loss >= 0 ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${result.net_gain_loss >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                        Net Unrealized {result.net_gain_loss >= 0 ? 'Gain' : 'Loss'}
                      </p>
                      <p className={`text-3xl font-black tracking-tight font-mono ${result.net_gain_loss >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                        {result.net_gain_loss >= 0 ? '+' : ''}{formatCurrency(result.net_gain_loss, result.base_currency)}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm leading-relaxed text-slate-300 font-medium">
                      <FileText size={16} className="inline mr-2 text-[#10b981] mb-0.5" />
                      {result.recommendation}
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Exposure Breakdown</h4>
                      <div className="space-y-2">
                        {result.results.map((res) => (
                          <div key={res.id} className="flex items-center justify-between text-sm bg-[#111111] p-3 rounded-lg border border-white/5">
                            <div>
                              <span className="font-bold text-slate-200 block">{res.currency_pair}</span>
                              <span className="text-xs text-slate-500 ml-2">{res.exposure_type}</span>
                            </div>
                            <div className="text-right">
                              <span className={`font-mono block ${res.gain_loss >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                                {res.gain_loss >= 0 ? '+' : ''}{formatCurrency(res.gain_loss, result.base_currency)}
                              </span>
                              <span className="text-xs text-slate-500">{res.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-12 text-center bg-[#0a0a0a]/50 min-h-[400px]">
                <ShieldAlert className="text-slate-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Evaluation Yet</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Add your portfolio exposures on the left and click evaluate to generate real-time indicative results.</p>
              </div>
            )}
          </div>
        </div>

      <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-widest pt-6 pb-4 border-t border-white/5 mt-6">
        <ShieldAlert size={14} className="text-[#10b981]" />
        <span>Rates are indicative and subject to market volatility under local accounting standards.</span>
      </div>
    </div>
  );
};


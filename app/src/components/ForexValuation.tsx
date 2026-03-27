import React, { useState } from 'react';
import { DollarSign, RefreshCw, TrendingUp, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const ForexValuation: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-full px-2 py-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <DollarSign className="text-[#10b981]" size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Forex Valuation</h2>
              <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#10b981]" /> Real-time currency conversion and forward premium calculation.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Panel */}
          <div className="col-span-1 lg:col-span-12">
            <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign size={18} className="text-[#10b981]" />
                  Currency Exposure Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 tracking-wide">Base Currency</label>
                    <select className="w-full bg-[#111111] border border-white/10 text-white rounded-lg p-3 font-medium outline-none focus:border-[#10b981]/50 focus:ring-1 focus:ring-[#10b981]/50 transition-all cursor-pointer">
                      <option value="USD">USD - US Dollar</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 tracking-wide">Quote Currency</label>
                    <select className="w-full bg-[#111111] border border-white/10 text-white rounded-lg p-3 font-medium outline-none focus:border-[#10b981]/50 focus:ring-1 focus:ring-[#10b981]/50 transition-all cursor-pointer">
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 tracking-wide">Exposure Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-lg">$</span>
                    <Input 
                      type="number" 
                      placeholder="e.g. 50000" 
                      className="bg-[#111111] border-white/10 text-emerald-400 font-mono text-lg font-bold tracking-wider pl-10 py-6" 
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    className="w-full md:w-64 bg-[#10b981] hover:bg-[#059669] text-black font-semibold text-base py-3 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02] border-0 outline-none flex items-center justify-center gap-2"
                    onClick={() => setLoading(true)}
                  >
                    {loading ? (
                      <span className="animate-pulse">Evaluating Position...</span>
                    ) : (
                      <>
                        <RefreshCw size={20} /> Evaluate FX Position
                      </>
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Warning */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest pt-8">
          <ShieldAlert size={14} className="text-[#10b981]" />
          <span>Rates are indicative and subject to market volatility.</span>
        </div>

      </div>
    </div>
  );
};

import { useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import { evaluateForexAPI, ForexExposureNew, ForexValuationOutputNew } from '@/lib/api'
import { useAppStore } from '@/store/appStore'

export default function ForexValuationPage() {
  const { setIsLoading, isLoading } = useAppStore()
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split('T')[0])
  const [baseCurrency, setBaseCurrency] = useState('INR')
  const [exposures, setExposures] = useState<ForexExposureNew[]>([
    {
      id: crypto.randomUUID(),
      currency_pair: '',
      exposure_type: 'Receivable',
      foreign_amount: 0,
      initial_rate: 0,
      current_rate: 0,
      description: ''
    }
  ])
  const [result, setResult] = useState<ForexValuationOutputNew | null>(null)

  const handleAddExposure = () => {
    setExposures([
      ...exposures,
      {
        id: crypto.randomUUID(),
        currency_pair: 'EUR/INR',
        exposure_type: 'Payable',
        foreign_amount: 0,
        initial_rate: 0,
        current_rate: 0,
        description: ''
      }
    ])
  }

  const handleRemoveExposure = (id: string) => {
    setExposures(exposures.filter(e => e.id !== id))
  }

  const handleChange = (id: string, field: keyof ForexExposureNew, value: any) => {
    setExposures(exposures.map(e => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const data = await evaluateForexAPI({
        valuation_date: valuationDate,
        base_currency: baseCurrency,
        exposures: exposures
      })
      setResult(data)
    } catch (error) {
      console.error("Forex valuation error:", error)
      alert("Failed to evaluate Forex exposures.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-teal-400" />
            Forex Valuation
          </h1>
          <p className="text-slate-400 mt-2">
            Evaluate foreign exchange exposures and calculate unrealized gains/losses per AS-11 / Ind AS 21.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-100">
              <Activity className="h-5 w-5 text-teal-400" />
              Exposure Details
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your current foreign currency receivables and payables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-white/5">
                <div className="space-y-2">
                  <Label>Valuation Date</Label>
                  <Input 
                    type="date" 
                    value={valuationDate} 
                    onChange={e => setValuationDate(e.target.value)} 
                    required 
                    className="bg-slate-900 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base Currency</Label>
                  <select 
                    value={baseCurrency} 
                    onChange={e => setBaseCurrency(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  >
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {exposures.map((exposure, index) => (
                  <div key={exposure.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4 relative group hover:border-teal-900/50 transition-colors">
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveExposure(exposure.id)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-medium text-slate-300">Exposure Entry</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Currency Pair</Label>
                        <Input 
                          placeholder="e.g. USD/INR"
                          value={exposure.currency_pair}
                          onChange={e => handleChange(exposure.id, 'currency_pair', e.target.value.toUpperCase())}
                          required
                          className="bg-slate-950 border-slate-800 uppercase"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <select 
                          value={exposure.exposure_type} 
                          onChange={e => handleChange(exposure.id, 'exposure_type', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
                        >
                          <option value="Receivable">Receivable (Asset)</option>
                          <option value="Payable">Payable (Liability)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Foreign Amount</Label>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={exposure.foreign_amount || ''}
                          onChange={e => handleChange(exposure.id, 'foreign_amount', parseFloat(e.target.value) || 0)}
                          required
                          className="bg-slate-950 border-slate-800"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Initial Rate</Label>
                        <Input 
                          type="number"
                          min="0"
                          step="0.0001"
                          value={exposure.initial_rate || ''}
                          onChange={e => handleChange(exposure.id, 'initial_rate', parseFloat(e.target.value) || 0)}
                          required
                          className="bg-slate-950 border-slate-800 font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Rate</Label>
                        <Input 
                          type="number"
                          min="0"
                          step="0.0001"
                          value={exposure.current_rate || ''}
                          onChange={e => handleChange(exposure.id, 'current_rate', parseFloat(e.target.value) || 0)}
                          required
                          className="bg-slate-950 border-slate-800 font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input 
                          placeholder="Invoice #1234"
                          value={exposure.description || ''}
                          onChange={e => handleChange(exposure.id, 'description', e.target.value)}
                          className="bg-slate-950 border-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  onClick={handleAddExposure}
                  variant="outline"
                  className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Exposure
                </Button>
                
                <Button 
                  type="submit" 
                  className="bg-teal-600 hover:bg-teal-500 text-white min-w-[140px] shadow-lg shadow-teal-500/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Evaluating...
                    </span>
                  ) : (
                    'Evaluate Portfolio'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="xl:col-span-1 border border-slate-800 rounded-xl bg-slate-900/30 overflow-hidden shadow-2xl flex flex-col h-full">
            <div className="p-6 bg-slate-950/50 border-b border-slate-800">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-teal-400" />
                Valuation Results
                </h3>
                <p className="text-sm text-slate-400 mt-1">Summary of Forex Impact</p>
            </div>
          
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            {result ? (
                <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 w-full relative overflow-hidden group">
                        <div className={`absolute inset-0 opacity-10 blur-xl transition-opacity duration-1000 ${result.net_gain_loss > 0 ? 'bg-emerald-500' : result.net_gain_loss < 0 ? 'bg-rose-500' : 'bg-slate-500'}`} />
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Net Forex Impact</span>
                            <div className="flex items-center gap-3">
                                {result.net_gain_loss > 0 ? (
                                    <TrendingUp className="h-8 w-8 text-emerald-400" />
                                ) : result.net_gain_loss < 0 ? (
                                    <TrendingDown className="h-8 w-8 text-rose-400" />
                                ) : (
                                    <Activity className="h-8 w-8 text-slate-400" />
                                )}
                                <span className={`text-4xl font-bold tracking-tight ${result.net_gain_loss > 0 ? 'text-emerald-400' : result.net_gain_loss < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                                    {Math.abs(result.net_gain_loss).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <span className="text-xs font-semibold mt-2 px-3 py-1 rounded-full bg-slate-900 text-slate-300 uppercase">
                                {result.base_currency} {result.net_gain_loss > 0 ? 'GAIN' : result.net_gain_loss < 0 ? 'LOSS' : 'NEUTRAL'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col items-center justify-center">
                            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Initial Value</p>
                            <p className="text-lg font-semibold text-slate-200">
                                {result.total_initial_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col items-center justify-center">
                            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Current Value</p>
                            <p className="text-lg font-semibold text-slate-200">
                                {result.total_current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>

                    <div className="text-left w-full p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
                         <h4 className="text-sm font-semibold text-slate-200 mb-2">Recommendation</h4>
                         <p className="text-sm text-slate-400 leading-relaxed">{result.recommendation}</p>
                    </div>

                    {result.results.length > 0 && (
                        <div className="w-full mt-4">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase text-left mb-3">Itemized Impact</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar text-left">
                                {result.results.map(res => (
                                    <div key={res.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{res.currency_pair}</p>
                                            <p className="text-xs text-slate-500">{res.exposure_type} • {res.foreign_amount.toLocaleString()}</p>
                                        </div>
                                        <div className={`text-sm font-bold ${res.gain_loss > 0 ? 'text-emerald-400' : res.gain_loss < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                            {res.gain_loss > 0 ? '+' : ''}{res.gain_loss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-slate-500 flex flex-col items-center max-w-xs">
                    <Activity className="h-12 w-12 mb-4 opacity-20" />
                    <p>Enter exposure details and evaluate to see the valuation results.</p>
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  )
}
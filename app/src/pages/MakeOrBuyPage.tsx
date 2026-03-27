import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, Label } from '@/components/ui/Badge'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

export default function MakeOrBuyPage() {
  const [productName, setProductName] = useState<string>('')
  const [analysisPeriod, setAnalysisPeriod] = useState<string>('3')
  const [discountRate, setDiscountRate] = useState<string>('10')
  const [options, setOptions] = useState<Array<{
    option_name: string
    annual_volume: number
    setup_cost: number
    per_unit_cost: number
    quality_score: number
    lead_time_days: number
    supplier_reliability?: string
  }>>([])
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newOption, setNewOption] = useState({
    option_name: '',
    annual_volume: '',
    setup_cost: '',
    per_unit_cost: '',
    quality_score: '',
    lead_time_days: ''
  })

  const addOption = () => {
    if (newOption.option_name && newOption.annual_volume && newOption.per_unit_cost && newOption.quality_score && newOption.lead_time_days) {
      setOptions([...options, {
        option_name: newOption.option_name,
        annual_volume: parseInt(newOption.annual_volume),
        setup_cost: newOption.setup_cost ? parseFloat(newOption.setup_cost) : 0,
        per_unit_cost: parseFloat(newOption.per_unit_cost),
        quality_score: parseFloat(newOption.quality_score),
        lead_time_days: parseInt(newOption.lead_time_days)
      }])
      setNewOption({ option_name: '', annual_volume: '', setup_cost: '', per_unit_cost: '', quality_score: '', lead_time_days: '' })
    }
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!productName || options.length < 2) {
      setError('Enter product name and at least 2 options (Make and Buy)')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/make-or-buy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_name: productName,
          options: options,
          analysis_period_years: parseInt(analysisPeriod),
          discount_rate: parseFloat(discountRate),
          currency: 'INR'
        })
      })
      
      if (!response.ok) throw new Error('Analysis failed')
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze make vs buy decision')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Make or Buy Decision</h1>
        <p className="text-sm text-slate-400 mt-1">Compare in-house production vs outsourcing options</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!result ? (
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Decision Analysis</CardTitle>
                <CardDescription>Compare Make vs Buy alternatives</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-6">
                  {error && (
                    <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Electronic Component A"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Analysis Period (Years) *</Label>
                      <Input
                        type="number"
                        value={analysisPeriod}
                        onChange={(e) => setAnalysisPeriod(e.target.value)}
                        placeholder="3"
                        min="1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Rate (%) *</Label>
                      <Input
                        type="number"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(e.target.value)}
                        placeholder="10"
                        step="0.1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-700 pt-4">
                    <h3 className="font-semibold text-slate-50">Options</h3>
                    
                    {options.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left py-2 px-2">Option</th>
                              <th className="text-right py-2 px-2">Annual Vol</th>
                              <th className="text-right py-2 px-2">Setup</th>
                              <th className="text-right py-2 px-2">Unit Cost</th>
                              <th className="text-right py-2 px-2">Quality</th>
                              <th className="text-right py-2 px-2">Lead Days</th>
                              <th className="text-center py-2 px-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {options.map((opt, idx) => (
                              <tr key={idx} className="border-b border-slate-700">
                                <td className="py-2 px-2 text-slate-300">{opt.option_name}</td>
                                <td className="text-right py-2 px-2 text-slate-300">{opt.annual_volume}</td>
                                <td className="text-right py-2 px-2 text-slate-300">₹{opt.setup_cost}</td>
                                <td className="text-right py-2 px-2 text-slate-300">₹{opt.per_unit_cost}</td>
                                <td className="text-right py-2 px-2 text-slate-300">{opt.quality_score}%</td>
                                <td className="text-right py-2 px-2 text-slate-300">{opt.lead_time_days}</td>
                                <td className="text-center py-2 px-2">
                                  <button
                                    type="button"
                                    onClick={() => removeOption(idx)}
                                    className="p-1 hover:bg-slate-600 rounded"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="grid grid-cols-7 gap-2 border-t border-slate-700 pt-3">
                      <Input
                        placeholder="Option Name"
                        value={newOption.option_name}
                        onChange={(e) => setNewOption({...newOption, option_name: e.target.value})}
                        className="text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Ann. Vol"
                        value={newOption.annual_volume}
                        onChange={(e) => setNewOption({...newOption, annual_volume: e.target.value})}
                        className="text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Setup"
                        value={newOption.setup_cost}
                        onChange={(e) => setNewOption({...newOption, setup_cost: e.target.value})}
                        className="text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Unit Cost"
                        value={newOption.per_unit_cost}
                        onChange={(e) => setNewOption({...newOption, per_unit_cost: e.target.value})}
                        className="text-xs"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        placeholder="Quality %"
                        value={newOption.quality_score}
                        onChange={(e) => setNewOption({...newOption, quality_score: e.target.value})}
                        className="text-xs"
                        min="0"
                        max="100"
                      />
                      <Input
                        type="number"
                        placeholder="Days"
                        value={newOption.lead_time_days}
                        onChange={(e) => setNewOption({...newOption, lead_time_days: e.target.value})}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        onClick={addOption}
                        className="bg-blue-600 hover:bg-blue-700 py-1 text-xs h-auto"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze Decision'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl space-y-4">
            <Button
              onClick={() => setResult(null)}
              className="mb-4"
              variant="outline"
            >
              ← New Analysis
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Analysis Results - {result.product_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-slate-400">Recommended Option</p>
                  <p className="text-2xl font-bold text-green-400">{result.recommended_option}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-50">Total Costs by Option</h4>
                  {result.total_costs_comparison && Object.entries(result.total_costs_comparison).map(([option, cost]: any) => (
                    <div key={option} className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
                      <span className="text-slate-300">{option}</span>
                      <span className="font-semibold text-slate-50">₹{cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-slate-300">{result.recommendation}</p>
                </div>

                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Risk Assessment</p>
                  <p className="text-sm text-slate-300">{result.risk_assessment}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
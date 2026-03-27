import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, Label } from '@/components/ui/Badge'
import { AlertCircle } from 'lucide-react'

export default function CostingForecastingPage() {
  const [projectName, setProjectName] = useState<string>('')
  const [fixedCosts, setFixedCosts] = useState<string>('')
  const [variableCost, setVariableCost] = useState<string>('')
  const [sellingPrice, setSellingPrice] = useState<string>('')
  const [periods, setPeriods] = useState<string>('5')
  const [forecastedUnits, setForecastedUnits] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!projectName || !fixedCosts || !variableCost || !sellingPrice || !forecastedUnits) {
      setError('Please fill all required fields')
      return
    }

    // Parse into array
    const units = forecastedUnits.split(',').map(u => parseInt(u.trim())).filter(u => !isNaN(u))
    if (units.length === 0) {
      setError('Enter units as comma-separated values (e.g., 1000, 1200, 1500)')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/costing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_name: projectName,
          fixed_costs: parseFloat(fixedCosts),
          variable_cost_per_unit: parseFloat(variableCost),
          selling_price_per_unit: parseFloat(sellingPrice),
          forecasted_units: units,
          periods: parseInt(periods),
          currency: 'INR'
        })
      })
      
      if (!response.ok) throw new Error('Analysis failed')
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze costing and forecast')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Costing & Forecasting</h1>
        <p className="text-sm text-slate-400 mt-1">Analyze costs and forecast profit/loss</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!result ? (
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Project Analysis</CardTitle>
                <CardDescription>Enter project costs and forecasted volumes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-5">
                  {error && (
                    <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g., Product X Launch"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fixed Costs (Annual) *</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">₹</span>
                        <Input
                          type="number"
                          value={fixedCosts}
                          onChange={(e) => setFixedCosts(e.target.value)}
                          placeholder="0"
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Variable Cost Per Unit *</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">₹</span>
                        <Input
                          type="number"
                          value={variableCost}
                          onChange={(e) => setVariableCost(e.target.value)}
                          placeholder="0"
                          step="0.01"
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Selling Price Per Unit *</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">₹</span>
                        <Input
                          type="number"
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(e.target.value)}
                          placeholder="0"
                          step="0.01"
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Periods *</Label>
                      <Input
                        type="number"
                        value={periods}
                        onChange={(e) => setPeriods(e.target.value)}
                        placeholder="5"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Forecasted Units per Period (comma-separated) *</Label>
                    <Input
                      value={forecastedUnits}
                      onChange={(e) => setForecastedUnits(e.target.value)}
                      placeholder="e.g., 1000, 1200, 1500, 1800, 2000"
                      required
                    />
                    <p className="text-xs text-slate-400">Enter {periods} values separated by commas</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze & Forecast'}
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
                <CardTitle>Analysis Results - {result.project_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Breakeven Point</p>
                    <p className="text-2xl font-bold text-slate-50">{result.breakeven_point.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Contribution Margin/Unit</p>
                    <p className="text-xl font-bold text-slate-50">₹{result.contribution_margin_per_unit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Margin Ratio</p>
                    <p className="text-xl font-bold text-blue-400">{result.contribution_margin_ratio.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-3">Total Forecast Profit/Loss</p>
                  <p className={`text-2xl font-bold ${result.total_forecast_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.total_forecast_profit >= 0 ? '+' : ''}₹{result.total_forecast_profit.toLocaleString()}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 px-2">Period</th>
                        <th className="text-right py-2 px-2">Profit/Loss (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.forecasted_profit_loss.map((profit: number, idx: number) => (
                        <tr key={idx} className="border-b border-slate-700">
                          <td className="py-2 px-2 text-slate-300">Year {idx + 1}</td>
                          <td className={`text-right py-2 px-2 font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-slate-300">{result.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, Label } from '@/components/ui/Badge'
import { AlertCircle, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react'

export default function ForexValuationPage() {
  const [exposureDate, setExposureDate] = useState<string>('')
  const [valuationMethod, setValuationMethod] = useState<string>('Current Rate')
  const [exposures, setExposures] = useState<Array<{
    currency: string
    amount: number
    transactionRate?: number
  }>>([])
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newExposure, setNewExposure] = useState({ currency: '', amount: '', transactionRate: '' })

  const addExposure = () => {
    if (newExposure.currency && newExposure.amount) {
      setExposures([...exposures, {
        currency: newExposure.currency,
        amount: parseFloat(newExposure.amount),
        transactionRate: newExposure.transactionRate ? parseFloat(newExposure.transactionRate) : undefined
      }])
      setNewExposure({ currency: '', amount: '', transactionRate: '' })
    }
  }

  const removeExposure = (index: number) => {
    setExposures(exposures.filter((_, i) => i !== index))
  }

  const handleValuate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!exposureDate || exposures.length === 0) {
      setError('Please enter date and at least one exposure')
      return
    }

    setIsLoading(true)
    try {
      // Call API endpoint
      const response = await fetch('http://localhost:8000/forex/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          exposure_date: exposureDate,
          exposures: exposures,
          valuation_method: valuationMethod,
          currency: 'INR'
        })
      })
      
      if (!response.ok) throw new Error('Valuation failed')
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to valuate forex exposure')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Forex Valuation</h1>
        <p className="text-sm text-slate-400 mt-1">Valuate foreign exchange exposures and determine tax treatment</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!result ? (
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Forex Exposure Details</CardTitle>
                <CardDescription>Add your foreign currency exposures</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValuate} className="space-y-6">
                  {error && (
                    <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Exposure Date *</Label>
                      <Input
                        type="date"
                        value={exposureDate}
                        onChange={(e) => setExposureDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valuation Method *</Label>
                      <select
                        value={valuationMethod}
                        onChange={(e) => setValuationMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
                      >
                        <option>Current Rate</option>
                        <option>Covering Rate</option>
                        <option>Average Rate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-50">Add Exposures</h3>
                    
                    {exposures.length > 0 && (
                      <div className="space-y-2">
                        {exposures.map((exp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                            <span className="text-sm text-slate-300">
                              {exp.currency} - ₹{exp.amount.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExposure(idx)}
                              className="p-1 hover:bg-slate-600 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Currency (USD, EUR...)"
                        value={newExposure.currency}
                        onChange={(e) => setNewExposure({...newExposure, currency: e.target.value.toUpperCase()})}
                      />
                      <Input
                        type="number"
                        placeholder="Amount (INR)"
                        value={newExposure.amount}
                        onChange={(e) => setNewExposure({...newExposure, amount: e.target.value})}
                      />
                      <Button
                        type="button"
                        onClick={addExposure}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Valuating...' : 'Valuate Forex Exposure'}
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
              ← New Valuation
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Valuation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Total Exposure (INR)</p>
                    <p className="text-2xl font-bold text-slate-50">₹{result.total_exposure_inr.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Forex Gain/Loss</p>
                    <p className={`text-2xl font-bold ${result.forex_gain_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.forex_gain_loss >= 0 ? '+' : ''}₹{result.forex_gain_loss.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">Tax Treatment</p>
                  <p className="text-slate-50 font-semibold">{result.treatment}</p>
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
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, Label } from '@/components/ui/Badge'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

export default function InventoryValuationPage() {
  const [valuationDate, setValuationDate] = useState<string>('')
  const [nrvPerUnit, setNrvPerUnit] = useState<string>('')
  const [units, setUnits] = useState<Array<{
    item_code: string
    quantity: number
    unit_cost: number
    valuation_method: string
  }>>([])
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newUnit, setNewUnit] = useState({
    item_code: '',
    quantity: '',
    unit_cost: '',
    valuation_method: 'FIFO'
  })

  const addUnit = () => {
    if (newUnit.item_code && newUnit.quantity && newUnit.unit_cost) {
      setUnits([...units, {
        item_code: newUnit.item_code,
        quantity: parseInt(newUnit.quantity),
        unit_cost: parseFloat(newUnit.unit_cost),
        valuation_method: newUnit.valuation_method
      }])
      setNewUnit({ item_code: '', quantity: '', unit_cost: '', valuation_method: 'FIFO' })
    }
  }

  const removeUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index))
  }

  const handleValuate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!valuationDate || units.length === 0) {
      setError('Please enter date and at least one inventory item')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/inventory/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          inventory_units: units,
          valuation_date: valuationDate,
          nrv_per_unit: nrvPerUnit ? parseFloat(nrvPerUnit) : null,
          currency: 'INR'
        })
      })
      
      if (!response.ok) throw new Error('Valuation failed')
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to valuate inventory')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Inventory Valuation</h1>
        <p className="text-sm text-slate-400 mt-1">Valuate inventory per AS-2/IND-AS 2 standards</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!result ? (
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Details</CardTitle>
                <CardDescription>Add inventory items for valuation</CardDescription>
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
                      <Label>Valuation Date *</Label>
                      <Input
                        type="date"
                        value={valuationDate}
                        onChange={(e) => setValuationDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NRV Per Unit (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">₹</span>
                        <Input
                          type="number"
                          value={nrvPerUnit}
                          onChange={(e) => setNrvPerUnit(e.target.value)}
                          placeholder="0"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-50">Inventory Items</h3>
                    
                    {units.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left py-2 px-2">Item Code</th>
                              <th className="text-right py-2 px-2">Qty</th>
                              <th className="text-right py-2 px-2">Unit Cost</th>
                              <th className="text-left py-2 px-2">Method</th>
                              <th className="text-center py-2 px-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {units.map((unit, idx) => (
                              <tr key={idx} className="border-b border-slate-700">
                                <td className="py-2 px-2 text-slate-300">{unit.item_code}</td>
                                <td className="text-right py-2 px-2 text-slate-300">{unit.quantity}</td>
                                <td className="text-right py-2 px-2 text-slate-300">₹{unit.unit_cost}</td>
                                <td className="py-2 px-2 text-slate-300">{unit.valuation_method}</td>
                                <td className="text-center py-2 px-2">
                                  <button
                                    type="button"
                                    onClick={() => removeUnit(idx)}
                                    className="p-1 hover:bg-slate-600 rounded"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="grid grid-cols-5 gap-2">
                      <Input
                        placeholder="Item Code"
                        value={newUnit.item_code}
                        onChange={(e) => setNewUnit({...newUnit, item_code: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={newUnit.quantity}
                        onChange={(e) => setNewUnit({...newUnit, quantity: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Unit Cost"
                        value={newUnit.unit_cost}
                        onChange={(e) => setNewUnit({...newUnit, unit_cost: e.target.value})}
                      />
                      <select
                        value={newUnit.valuation_method}
                        onChange={(e) => setNewUnit({...newUnit, valuation_method: e.target.value})}
                        className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 text-sm"
                      >
                        <option>FIFO</option>
                        <option>LIFO</option>
                        <option>WAC</option>
                        <option>Standard</option>
                      </select>
                      <Button
                        type="button"
                        onClick={addUnit}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Valuating...' : 'Valuate Inventory'}
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Book Value</p>
                    <p className="text-2xl font-bold text-slate-50">₹{result.book_value.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">NRV</p>
                    <p className="text-2xl font-bold text-slate-50">₹{result.net_realizable_value.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Final Valuation</p>
                    <p className="text-2xl font-bold text-green-400">₹{result.final_valuation.toLocaleString()}</p>
                  </div>
                </div>

                {result.write_off_required > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-slate-400">Write-off Required</p>
                    <p className="text-lg font-semibold text-red-400">₹{result.write_off_required.toLocaleString()}</p>
                  </div>
                )}

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-slate-300">{result.compliance_note}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
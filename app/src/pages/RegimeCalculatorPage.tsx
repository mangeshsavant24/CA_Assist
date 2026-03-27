import { useState } from 'react'
import { compareRegimeAPI, RegimeOutput } from '@/lib/api'
import { formatTaxAmount, formatPercentage } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

export default function RegimeCalculatorPage() {
  const [grossIncome, setGrossIncome] = useState<string>('')
  const [sec80c, setSec80c] = useState<string>('')
  const [sec80d, setSec80d] = useState<string>('')
  const [hraExemption, setHraExemption] = useState<string>('')
  const [otherDeductions, setOtherDeductions] = useState<string>('')
  const [result, setResult] = useState<RegimeOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!grossIncome || parseInt(grossIncome) <= 0) {
      setError('Please enter a valid gross income')
      return
    }

    setIsLoading(true)
    try {
      const response = await compareRegimeAPI({
        gross_income: parseInt(grossIncome),
        sec_80c: sec80c ? parseInt(sec80c) : 0,
        sec_80d: sec80d ? parseInt(sec80d) : 0,
        hra_exemption: hraExemption ? parseInt(hraExemption) : 0,
        other_deductions: otherDeductions ? parseInt(otherDeductions) : 0,
      })
      setResult(response)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate tax comparison')
      console.error('Calculation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Tax Regime Comparison</h1>
        <p className="text-sm text-slate-400 mt-1">Compare old vs. new income tax regime</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!result ? (
          <div className="max-w-2xl">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Income Details</CardTitle>
                <CardDescription>Enter your income and deductions</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCalculate} className="space-y-5">
                  {error && (
                    <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="grossIncome" className="block">
                      Gross Income (Annual) *
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">₹</span>
                      <Input
                        id="grossIncome"
                        type="number"
                        value={grossIncome}
                        onChange={(e) => setGrossIncome(e.target.value)}
                        placeholder="0"
                        className="flex-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sec80c" className="block">
                      Section 80C Deductions (Optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">₹</span>
                      <Input
                        id="sec80c"
                        type="number"
                        value={sec80c}
                        onChange={(e) => setSec80c(e.target.value)}
                        placeholder="0 (Max: ₹1,50,000)"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Life insurance, PPF, ELSS, NPS, etc.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sec80d" className="block">
                      Section 80D Deductions (Optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">₹</span>
                      <Input
                        id="sec80d"
                        type="number"
                        value={sec80d}
                        onChange={(e) => setSec80d(e.target.value)}
                        placeholder="0"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Health insurance premiums</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hra" className="block">
                      HRA Exemption (Optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">₹</span>
                      <Input
                        id="hra"
                        type="number"
                        value={hraExemption}
                        onChange={(e) => setHraExemption(e.target.value)}
                        placeholder="0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherDeductions" className="block">
                      Other Deductions (Optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">₹</span>
                      <Input
                        id="otherDeductions"
                        type="number"
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(e.target.value)}
                        placeholder="0"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Health insurance, education loan, donations</p>
                  </div>

                  <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                    Calculate & Compare
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Verdict Card */}
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                      {result.verdict.recommended_regime}
                    </h3>
                    <p className="text-slate-300 mb-4">{result.verdict.reason}</p>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Tax Saving</p>
                        <p className="text-2xl font-mono font-bold text-emerald-400">
                          {formatTaxAmount(result.verdict.tax_saving)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Saving %</p>
                        <p className="text-2xl font-mono font-bold text-emerald-400">
                          {formatPercentage(result.verdict.saving_percentage)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <TrendingUp className="w-12 h-12 text-emerald-500 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            {/* Regime Comparison */}
            <div className="grid grid-cols-2 gap-6">
              {/* Old Regime */}
              <RegimeCard title="Old Regime" regime={result.old_regime} />
              {/* New Regime */}
              <RegimeCard title="New Regime" regime={result.new_regime} />
            </div>

            {/* Citations */}
            {result.citations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">References</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.citations.map((citation, idx) => (
                      <Badge key={idx} variant="citation" className="text-xs font-mono">
                        {citation}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setResult(null)
                setGrossIncome('')
                setSec80c('')
                setSec80d('')
                setHraExemption('')
                setOtherDeductions('')
              }}
            >
              Calculate Another
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RegimeCard({ title, regime }: { title: string; regime: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 uppercase mb-1">Gross Income</p>
          <p className="text-xl font-mono font-bold text-teal-400">
            {formatTaxAmount(regime.taxable_income + (regime.total_deductions || 0))}
          </p>
        </div>

        {regime.total_deductions !== undefined && regime.total_deductions > 0 && (
          <div>
            <p className="text-xs text-slate-400 uppercase mb-1">Total Deductions</p>
            <p className="text-lg font-mono text-slate-300">{formatTaxAmount(regime.total_deductions)}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-slate-400 uppercase mb-1">Taxable Income</p>
          <p className="text-lg font-mono text-slate-300">{formatTaxAmount(regime.taxable_income)}</p>
        </div>

        <Separator />

        {regime.slab_breakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase font-semibold">Tax Slabs</p>
            <div className="space-y-1 text-xs">
              {regime.slab_breakdown.map((slab: any, idx: number) => (
                <div key={idx} className="flex justify-between text-slate-400">
                  <span>{slab.slab}</span>
                  <span className="text-slate-300">{formatTaxAmount(slab.tax)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Base Tax</span>
            <span className="font-mono text-slate-300">{formatTaxAmount(regime.base_tax)}</span>
          </div>
          {regime.rebate > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Rebate</span>
              <span className="font-mono">-{formatTaxAmount(regime.rebate)}</span>
            </div>
          )}
          {regime.cess > 0 && (
            <div className="flex justify-between text-amber-400">
              <span>Health & Education Cess (4%)</span>
              <span className="font-mono">+{formatTaxAmount(regime.cess)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center pt-2">
          <span className="font-semibold text-slate-300">Total Tax Payable</span>
          <span className="text-2xl font-mono font-bold text-teal-400">
            {formatTaxAmount(regime.total_tax)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

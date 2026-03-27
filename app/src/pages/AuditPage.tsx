import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, Label } from '@/components/ui/Badge'
import { AlertCircle } from 'lucide-react'

const AUDIT_AREAS = ['Revenue', 'Inventory', 'Receivables', 'Payables', 'Fixed Assets', 'Bank & Cash']

export default function AuditPage() {
  const [auditType, setAuditType] = useState<string>('Statutory')
  const [companyName, setCompanyName] = useState<string>('')
  const [fiscalYear, setFiscalYear] = useState<string>('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    )
  }

  const handleConduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyName || !fiscalYear || selectedScopes.length === 0) {
      setError('Please fill all required fields and select audit scope')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/audit/conduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          audit_type: auditType,
          company_name: companyName,
          fiscal_year: fiscalYear,
          audit_scope: selectedScopes,
          currency: 'INR'
        })
      })
      
      if (!response.ok) throw new Error('Audit failed')
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to conduct audit')
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/20 text-red-300'
      case 'High':
        return 'bg-orange-500/20 text-orange-300'
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-300'
      default:
        return 'bg-green-500/20 text-green-300'
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Financial Audit</h1>
        <p className="text-sm text-slate-400 mt-1">Statutory, Internal, and Compliance audit assessment</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!result ? (
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Audit Plan</CardTitle>
                <CardDescription>Configure audit type, scope, and company details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConduct} className="space-y-6">
                  {error && (
                    <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Audit Type *</Label>
                      <select
                        value={auditType}
                        onChange={(e) => setAuditType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50"
                      >
                        <option>Statutory</option>
                        <option>Internal</option>
                        <option>Compliance</option>
                        <option>Forensic</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g., ABC Ltd"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fiscal Year End *</Label>
                    <Input
                      type="date"
                      value={fiscalYear}
                      onChange={(e) => setFiscalYear(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-4 border-t border-slate-700 pt-4">
                    <h3 className="font-semibold text-slate-50">Audit Scope *</h3>
                    <p className="text-sm text-slate-400">Select areas to audit</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {AUDIT_AREAS.map(area => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleScope(area)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            selectedScopes.includes(area)
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 ${
                              selectedScopes.includes(area)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-slate-500'
                            }`} />
                            <span className="text-slate-50 font-medium">{area}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-slate-400">
                      Selected: {selectedScopes.length} area{selectedScopes.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Conducting Audit...' : 'Conduct Audit'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-3xl space-y-4">
            <Button
              onClick={() => setResult(null)}
              className="mb-4"
              variant="outline"
            >
              ← New Audit
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{result.audit_type} Audit - {result.company_name}</CardTitle>
                <CardDescription>Fiscal Year: {result.fiscal_year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">Compliance Status</p>
                    <p className={`text-lg font-bold ${
                      result.compliance_status.includes('PASS')
                        ? 'text-green-400'
                        : result.compliance_status.includes('FAIL')
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}>
                      {result.compliance_status}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">Materiality Threshold</p>
                    <p className="text-lg font-bold text-slate-50">₹{result.materiality_threshold.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Assessment</p>
                  <p className="text-sm text-slate-300">{result.overall_assessment}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-50">Audit Findings ({result.findings.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.findings.map((finding: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-lg ${getSeverityColor(finding.severity)}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{finding.area}</span>
                              <Badge className="text-xs px-1.5" variant="default">
                                {finding.severity}
                              </Badge>
                            </div>
                            <p className="text-xs mb-1">{finding.finding}</p>
                            <p className="text-xs opacity-80">→ {finding.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Auditor Recommendation</p>
                  <p className="text-sm text-green-300">{result.auditor_recommendation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
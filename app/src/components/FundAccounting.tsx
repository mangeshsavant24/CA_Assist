import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  TrendingUp,
  Loader,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Percent,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { calculateFundNAVAPI, FundInput, FundOutput } from '../lib/api'
import { formatCurrency, cn } from '../lib/utils'

interface Transaction {
  id: string
  type: 'contribution' | 'withdrawal' | 'return'
  amount: number
  date: string
  description: string
}

export const FundAccounting: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form inputs
  const [fundName, setFundName] = useState('')
  const [fundType, setFundType] = useState<'General' | 'Endowment' | 'Restricted' | 'Other'>('General')
  const [openingBalance, setOpeningBalance] = useState('')
  const [shareClasses, setShareClasses] = useState('')
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [newTransaction, setNewTransaction] = useState({
    type: 'contribution' as const,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  // Results
  const [result, setResult] = useState<FundOutput | null>(null)

  const addTransaction = () => {
    if (!newTransaction.amount || isNaN(parseFloat(newTransaction.amount))) {
      setError('Please enter a valid amount')
      return
    }

    const transaction: Transaction = {
      id: `trans-${Date.now()}`,
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      date: newTransaction.date,
      description: newTransaction.description,
    }

    setTransactions([...transactions, transaction])
    setNewTransaction({
      type: 'contribution',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    })
    setError(null)
  }

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  const handleCalculate = async () => {
    setError(null)
    setSuccess(false)

    if (!fundName || !openingBalance) {
      setError('Please fill in fund name and opening balance')
      return
    }

    if (isNaN(parseFloat(openingBalance))) {
      setError('Opening balance must be a valid number')
      return
    }

    if (transactions.length === 0) {
      setError('Please add at least one transaction')
      return
    }

    setLoading(true)

    try {
      const input: FundInput = {
        fund_name: fundName,
        fund_type: fundType,
        opening_balance: parseFloat(openingBalance),
        share_classes: shareClasses ? parseInt(shareClasses) : undefined,
        transactions: transactions.map((t) => ({
          transaction_type: t.type,
          amount: t.amount,
          date: t.date,
          description: t.description,
        })),
        currency,
      }

      const navResult = await calculateFundNAVAPI(input)
      setResult(navResult)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to calculate NAV. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTotalTransactions = () => {
    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }

  const getTransactionsByType = (type: 'contribution' | 'withdrawal' | 'return') => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="text-violet-400" size={28} />
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Fund Accounting</h1>
          <p className="text-slate-400">Calculate NAV and analyze fund performance</p>
        </div>
      </div>

      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-red-950 border border-red-700 text-red-200">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {success && result && (
        <div className="flex gap-3 p-4 rounded-lg bg-green-950 border border-green-700 text-green-200">
          <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
          <div>Fund NAV calculated successfully!</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fund Details */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Fund Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Fund Name *
                  </label>
                  <Input
                    placeholder="e.g., General Fund 2024"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Fund Type *
                  </label>
                  <select
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="General">General</option>
                    <option value="Endowment">Endowment</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Opening Balance ({currency}) *
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Share Classes
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 1"
                    value={shareClasses}
                    onChange={(e) => setShareClasses(e.target.value)}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
                    className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Transaction Form */}
              <div className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Type
                    </label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="contribution">Contribution</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="return">Return</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, amount: e.target.value })
                      }
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Description
                    </label>
                    <Input
                      placeholder="e.g., Q1 Contribution"
                      value={newTransaction.description}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={addTransaction}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  <Plus size={16} />
                  Add Transaction
                </Button>
              </div>

              {/* Transactions List */}
              {transactions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              transaction.type === 'contribution'
                                ? 'bg-green-950 text-green-400'
                                : transaction.type === 'withdrawal'
                                  ? 'bg-red-950 text-red-400'
                                  : 'bg-blue-950 text-blue-400'
                            )}
                          >
                            {transaction.type === 'contribution'
                              ? 'Contribution'
                              : transaction.type === 'withdrawal'
                                ? 'Withdrawal'
                                : 'Return'}
                          </span>
                          <span className="text-sm text-slate-400">{transaction.date}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{transaction.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-slate-50">
                            {formatCurrency(transaction.amount, currency)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeTransaction(transaction.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No transactions added yet. Add at least one to proceed.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loading}
          >
            {loading ? 'Calculating NAV...' : 'Calculate NAV'}
          </Button>
        </div>

        {/* Summary & Results */}
        <div className="space-y-6">
          {/* Summary */}
          <Card className="bg-slate-900 border-slate-700 top-4">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Opening Balance
                </p>
                <p className="text-2xl font-bold text-slate-50 mt-1">
                  {openingBalance ? formatCurrency(parseFloat(openingBalance), currency) : '-'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Contributions:</span>
                  <span className="text-slate-50">
                    {formatCurrency(getTransactionsByType('contribution'), currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Withdrawals:</span>
                  <span className="text-slate-50">
                    {formatCurrency(getTransactionsByType('withdrawal'), currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400">Returns:</span>
                  <span className="text-slate-50">
                    {formatCurrency(getTransactionsByType('return'), currency)}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Total Transactions
                </p>
                <p className="text-xl font-bold text-violet-400 mt-1">
                  {transactions.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="bg-slate-900 border-violet-600/50">
              <CardHeader>
                <CardTitle className="text-lg text-violet-400">NAV Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Closing Balance
                  </p>
                  <p className="text-2xl font-bold text-slate-50 mt-1">
                    {formatCurrency(result.nav_detail.closing_balance, currency)}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">NAV per Unit:</span>
                    <span className="font-semibold">{result.nav_detail.nav_per_unit.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ROI %:</span>
                    <span className="font-semibold text-green-400">
                      {result.nav_detail.roi_percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {result.recommendation && (
                  <div className="mt-4 p-3 rounded-lg bg-violet-950/50 border border-violet-700/50">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">
                      Recommendation
                    </p>
                    <p className="text-sm text-slate-200">{result.recommendation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

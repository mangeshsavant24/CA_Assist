import axios from 'axios'
import { useAppStore } from '../store/appStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAppStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      const { logout } = useAppStore.getState()
      logout()
    }
    return Promise.reject(error)
  }
)

// Auth Interfaces
export interface UserRegister {
  email: string
  password: string
  full_name?: string
}

export interface UserLogin {
  username: string // email
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
}

export interface UserResponse {
  id: string
  email: string
  full_name?: string
  created_at: string
}

// Query Interfaces
export interface QueryRequest {
  query: string
  user_id: string
}

export interface Citation {
  source: string
  section: string
  act: string
  url?: string
}

export interface CitedResponse {
  answer: string
  citations: Citation[]
}

export interface RegimeInput {
  gross_income: number
  sec_80c?: number
  sec_80d?: number
  hra_exemption?: number
  other_deductions?: number
}

export interface SlabBreakdownItem {
  slab: string
  rate: string
  tax: number
}

export interface RegimeDetail {
  taxable_income: number
  total_deductions?: number
  slab_breakdown: SlabBreakdownItem[]
  base_tax: number
  cess: number
  rebate: number
  total_tax: number
}

export interface Verdict {
  recommended_regime: string
  tax_saving: number
  saving_percentage: number
  reason: string
}

export interface CapitalBudgetOutput {
  project_name?: string
  currency: 'INR' | 'USD'
  npv: number
  irr?: number
  payback_period?: number
  profitability_index?: number
  recommendation: string
}

export interface RegimeOutput {
  old_regime: RegimeDetail
  new_regime: RegimeDetail
  verdict: Verdict
  citations: string[]
}

export const queryAPI = async (request: QueryRequest): Promise<CitedResponse> => {
  const response = await apiClient.post<CitedResponse>('/query', request)
  return response.data
}

export const compareRegimeAPI = async (input: RegimeInput): Promise<RegimeOutput> => {
  const response = await apiClient.post<RegimeOutput>('/regime/compare', input)
  return response.data
}

export interface CapitalBudgetInput {
  initial_investment: number
  cash_flows: number[]
  discount_rate: number
  project_name?: string
  currency?: 'INR' | 'USD'
}

export interface FundTransaction {
  transaction_type: 'contribution' | 'withdrawal' | 'return'
  amount: number
  date?: string
  description?: string
}

export interface NAVDetail {
  fund_name: string
  fund_type: 'General' | 'Endowment' | 'Restricted' | 'Other'
  opening_balance: number
  total_contributions: number
  total_withdrawals: number
  total_returns: number
  closing_balance: number
  share_classes: number
  nav_per_unit: number
  roi_percentage: number
  transaction_count: number
  ledger_entries: Array<{
    date: string
    transaction_type: string
    description?: string
    amount: number
    balance: number
  }>
}

export interface FundOutput {
  nav_detail: NAVDetail
  recommendation: string
  currency: 'INR' | 'USD'
}

export interface FundInput {
  fund_name: string
  fund_type: 'General' | 'Endowment' | 'Restricted' | 'Other'
  opening_balance: number
  share_classes?: number
  transactions: FundTransaction[]
  currency?: 'INR' | 'USD'
}

export const evaluateCapitalBudgetAPI = async (
  input: CapitalBudgetInput
): Promise<CapitalBudgetOutput> => {
  const response = await apiClient.post<CapitalBudgetOutput>('/capital-budget/evaluate', input)
  return response.data
}

export const calculateFundNAVAPI = async (input: FundInput): Promise<FundOutput> => {
  const response = await apiClient.post<FundOutput>('/fund/nav', input)
  return response.data
}

export const uploadDocumentAPI = async (file: File, userId: string): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<any>(
    `/document/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}

export const getHealthAPI = async () => {
  const response = await apiClient.get('/health')
  return response.data
}

// Auth APIs
export const registerAPI = async (data: UserRegister): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>('/auth/register', data)
  return response.data
}

export const loginAPI = async (credentials: UserLogin): Promise<AuthToken> => {
  const response = await apiClient.post<AuthToken>('/auth/login', credentials)
  return response.data
}

export default apiClient

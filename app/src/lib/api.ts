import axios from 'axios'
import { useAppStore } from '../store/appStore'
// Safely default API base URL to browser origin hostname (useful for testing on cross-device LAN)
const isBrowser = typeof window !== 'undefined'
const defaultHost = isBrowser ? window.location.hostname : 'localhost'
const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'http://127.0.0.1:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type: let Axios auto-detect
  // - JSON requests: Axios auto-sets application/json
  // - Multipart requests: Axios auto-sets multipart/form-data with boundary
})

if (isBrowser && !((import.meta as any).env?.VITE_API_URL as string)) {
  console.info(`Using default backend URL: ${API_BASE_URL}`)
}

// Request interceptor to add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAppStore.getState()
    if (accessToken) {
      // Use config.headers.set to ensure modern axios versions correctly serialize the header
      config.headers.set('Authorization', `Bearer ${accessToken}`)
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

export const getCurrentUserAPI = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/auth/me')
  return response.data
}

// Query Interfaces
export interface QueryRequest {
  query: string
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
  const response = await apiClient.post<CitedResponse>('/query', { query: request.query })
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

  console.log('[uploadDocumentAPI] Sending file:', file.name, 'size:', file.size)
  
  try {
    // Do not set Content-Type manually for multipart/form-data; Axios sets boundary automatically.
    const response = await apiClient.post<any>(`/document/upload`, formData)
    
    console.log('[uploadDocumentAPI] Success response:', response.status, response.data)
    if (!response.data) {
      throw new Error('Response.data is undefined')
    }
    return response.data
  } catch (error: any) {
    console.error('[uploadDocumentAPI] Request failed:', error)
    console.error('[uploadDocumentAPI] Error status:', error?.response?.status)
    console.error('[uploadDocumentAPI] Error data:', error?.response?.data)
    throw error
  }
}

export const getHealthAPI = async () => {
  const response = await apiClient.get('/health')
  return response.data
}

export const listDocumentsAPI = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get<any>('/document/list')
    const data = response.data
    if (Array.isArray(data)) return data
    if (data?.documents && Array.isArray(data.documents)) return data.documents
    return []
  } catch {
    return []
  }
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

// Forex Valuation Interfaces
export interface ForexExposureNew {
  id: string
  currency_pair: string
  exposure_type: 'Receivable' | 'Payable'
  foreign_amount: number
  initial_rate: number
  current_rate: number
  description?: string
}

export interface ForexValuationInputNew {
  valuation_date: string
  base_currency: string
  exposures: ForexExposureNew[]
}

export interface ForexExposureResult {
  id: string
  currency_pair: string
  exposure_type: string
  foreign_amount: number
  initial_base_value: number
  current_base_value: number
  gain_loss: number
  status: 'Gain' | 'Loss' | 'Neutral'
  description?: string
}

export interface ForexValuationOutputNew {
  valuation_date: string
  base_currency: string
  total_initial_value: number
  total_current_value: number
  net_gain_loss: number
  results: ForexExposureResult[]
  recommendation: string
}

export const evaluateForexAPI = async (input: ForexValuationInputNew): Promise<ForexValuationOutputNew> => {
  const response = await apiClient.post<ForexValuationOutputNew>('/forex/evaluate', input)
  return response.data
}

export default apiClient

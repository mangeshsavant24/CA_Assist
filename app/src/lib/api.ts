import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface QueryRequest {
  query: string
  user_id: string
}

export interface CitedResponse {
  answer: string
  citations: string[]
}

export interface RegimeInput {
  gross_income: number
  sec_80c?: number
  sec_80d?: number
  hra_exemption?: number
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

export const uploadDocumentAPI = async (file: File, userId: string): Promise<CitedResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<CitedResponse>(
    `/document/upload?user_id=${userId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}

export const getHealthAPI = async () => {
  const response = await apiClient.get('/health')
  return response.data
}

export default apiClient

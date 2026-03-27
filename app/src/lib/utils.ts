import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  const currencyMap = {
    INR: { locale: 'en-IN', code: 'INR' },
    USD: { locale: 'en-US', code: 'USD' }
  }
  
  const config = currencyMap[currency]
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTaxAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function extractCitationFromText(text: string): string[] {
  const citationPattern = /\[([^\]]+)\]/g
  const matches = text.match(citationPattern)
  return matches ? matches.map(m => m.slice(1, -1)) : []
}

export function sanitizeHTML(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

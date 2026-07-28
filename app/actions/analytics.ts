'use server'

import { apiFetch } from '@/lib/api'
import type { Invoice } from './invoices'

export interface AnalyticsMetrics {
  totalRevenue: number
  totalPaid: number
  outstandingAmount: number
  totalInvoices: number
  paidInvoices: number
  unpaidInvoices: number
}

export interface Analytics {
  metrics: AnalyticsMetrics
  recentInvoices: Invoice[]
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface StatusBreakdown {
  draft: number
  sent: number
  partial: number
  paid: number
}

export async function getAnalytics(businessId: string) {
  return apiFetch<Analytics>(`/api/businesses/${businessId}/analytics`)
}

export async function getMonthlyRevenue(businessId: string) {
  return apiFetch<MonthlyRevenue[]>(`/api/businesses/${businessId}/analytics/monthly-revenue`)
}

export async function getInvoiceStatusBreakdown(businessId: string) {
  return apiFetch<StatusBreakdown>(`/api/businesses/${businessId}/analytics/status-breakdown`)
}

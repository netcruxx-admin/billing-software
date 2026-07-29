'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface InvoiceItem {
  id: string
  invoiceId: string
  productId?: string | null
  variantId?: string | null
  description: string
  quantity: number | null
  unit?: string | null
  unitPrice: number
  amount: number
  taxRate: number
  taxAmount: number
  hsnCode?: string | null
  mrp?: number | null
  packSize?: string | null
  categoryName?: string | null
  cdRate: number
  tdRate: number
  discountAmount: number
  giftNote?: string | null
  customFields?: Record<string, string> | null
  createdAt: string
}

export interface TaxBreakdown {
  rate: number
  taxableAmount: number
  taxAmount: number
}

export interface Invoice {
  id: string
  businessId: string
  customerId?: string | null
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string | null
  subtotal: number
  tax: number
  total: number
  status: string
  notes?: string | null
  referenceNote?: string | null
  paidAmount?: number | null
  deliveryDate?: string | null
  paymentMode?: string | null
  createdAt: string
  updatedAt: string
  customerName?: string | null
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[]
  taxBreakdown: TaxBreakdown[]
}

export async function getInvoices(businessId: string) {
  return apiFetch<Invoice[]>(`/api/businesses/${businessId}/invoices`)
}

export async function getInvoice(invoiceId: string, businessId: string) {
  return apiFetch<InvoiceDetail>(`/api/businesses/${businessId}/invoices/${invoiceId}`)
}

export async function getInvoiceById(invoiceId: string, businessId: string) {
  return apiFetch<InvoiceDetail>(`/api/businesses/${businessId}/invoices/${invoiceId}`)
}

export async function getInvoiceItems(invoiceId: string, businessId: string) {
  const invoice = await apiFetch<InvoiceDetail>(`/api/businesses/${businessId}/invoices/${invoiceId}`)
  return invoice.items
}

export async function createInvoice(businessId: string, data: {
  customerId?: string
  invoiceDate: Date
  dueDate?: Date
  deliveryDate?: Date
  paymentMode?: string
  items: Array<{
    productId?: string
    variantId?: string
    description: string
    quantity?: number
    unit?: string
    unitPrice: number
    taxRate?: number
    hsnCode?: string
    mrp?: number
    packSize?: string
    cdRate?: number
    tdRate?: number
    giftNote?: string
    customFields?: Record<string, string>
  }>
  notes?: string
  referenceNote?: string
}) {
  const invoice = await apiFetch<InvoiceDetail>(`/api/businesses/${businessId}/invoices`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      invoiceDate: data.invoiceDate.toISOString(),
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
      deliveryDate: data.deliveryDate ? data.deliveryDate.toISOString() : undefined,
    }),
  })

  revalidatePath(`/dashboard/businesses/${businessId}`)
  return invoice.id
}

export async function deleteInvoice(invoiceId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/invoices/${invoiceId}`, { method: 'DELETE' })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

export async function markInvoicePaid(invoiceId: string, businessId: string, paidAmount: number) {
  await apiFetch<InvoiceDetail>(`/api/businesses/${businessId}/invoices/${invoiceId}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({ paidAmount }),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

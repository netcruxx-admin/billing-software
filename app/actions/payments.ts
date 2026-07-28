'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface Payment {
  id: string
  businessId: string
  invoiceId: string
  amount: number
  method: string
  status: string
  notes?: string | null
  createdAt: string
  updatedAt: string
  invoiceNumber?: string
}

// Record a payment against an invoice. This is a demo app: there is no real
// payment processor wired up, so a payment is recorded directly rather than
// going through an external gateway.
export async function recordPayment(
  invoiceId: string,
  businessId: string,
  amount: number,
  method: string
) {
  const payment = await apiFetch<Payment>(`/api/businesses/${businessId}/invoices/${invoiceId}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount, method }),
  })

  revalidatePath(`/dashboard/businesses/${businessId}`)
  revalidatePath(`/dashboard/businesses/${businessId}/invoices/${invoiceId}`)
  return payment.id
}

// Get payment history for an invoice
export async function getPaymentHistory(invoiceId: string, businessId: string) {
  return apiFetch<Payment[]>(`/api/businesses/${businessId}/invoices/${invoiceId}/payments`)
}

// Get every payment recorded for a business, with the related invoice number attached
export async function getBusinessPayments(businessId: string) {
  return apiFetch<Payment[]>(`/api/businesses/${businessId}/payments`)
}

// Mark invoice as paid manually, without recording an itemized payment
export async function markInvoiceAsPaid(invoiceId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/invoices/${invoiceId}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

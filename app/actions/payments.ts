'use server'

import { demoDb } from '@/lib/demo-db'
import { revalidatePath } from 'next/cache'

// Record a payment against an invoice. This is a demo app: there is no real
// payment processor wired up, so a payment is recorded directly rather than
// going through an external gateway.
export async function recordPayment(
  invoiceId: string,
  businessId: string,
  amount: number,
  method: string
) {
  const invoice = await demoDb.getInvoice(invoiceId)
  if (!invoice || invoice.businessId !== businessId) throw new Error('Invoice not found')
  if (!(amount > 0)) throw new Error('Payment amount must be greater than zero')

  const payment = await demoDb.createPayment(businessId, {
    invoiceId,
    amount,
    method,
    status: 'completed',
  })

  const newPaidAmount = (Number(invoice.paidAmount) || 0) + amount
  const newStatus = newPaidAmount >= Number(invoice.total) ? 'paid' : 'partial'
  await demoDb.updateInvoicePayment(invoiceId, newPaidAmount, newStatus)

  revalidatePath(`/dashboard/businesses/${businessId}`)
  revalidatePath(`/dashboard/businesses/${businessId}/invoices/${invoiceId}`)
  return payment.id
}

// Get payment history for an invoice
export async function getPaymentHistory(invoiceId: string, businessId: string) {
  const invoice = await demoDb.getInvoice(invoiceId)
  if (!invoice || invoice.businessId !== businessId) throw new Error('Invoice not found')
  return demoDb.getPaymentsByInvoice(invoiceId)
}

// Get every payment recorded for a business, with the related invoice number attached
export async function getBusinessPayments(businessId: string) {
  const [payments, invoices] = await Promise.all([
    demoDb.getPayments(businessId),
    demoDb.getInvoices(businessId),
  ])

  const invoiceNumberById = new Map(invoices.map((inv) => [inv.id, inv.invoiceNumber]))

  return [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((p) => ({ ...p, invoiceNumber: invoiceNumberById.get(p.invoiceId) ?? 'Unknown' }))
}

// Mark invoice as paid manually, without recording an itemized payment
export async function markInvoiceAsPaid(invoiceId: string, businessId: string) {
  const invoice = await demoDb.getInvoice(invoiceId)
  if (!invoice || invoice.businessId !== businessId) throw new Error('Invoice not found')

  await demoDb.updateInvoicePayment(invoiceId, Number(invoice.total), 'paid')
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

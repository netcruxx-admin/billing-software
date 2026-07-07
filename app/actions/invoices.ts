'use server'

import { demoDb } from '@/lib/demo-db'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

export async function getInvoices(businessId: string) {
  return demoDb.getInvoices(businessId)
}

export async function getInvoice(invoiceId: string) {
  const invoice = await demoDb.getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  const items = await demoDb.getInvoiceItems(invoiceId)
  return { ...invoice, items }
}

export async function getInvoiceById(invoiceId: string, businessId: string) {
  const invoice = await demoDb.getInvoice(invoiceId)
  if (!invoice || invoice.businessId !== businessId) throw new Error('Invoice not found')
  return invoice
}

export async function getInvoiceItems(invoiceId: string) {
  return demoDb.getInvoiceItems(invoiceId)
}

export async function createInvoice(businessId: string, data: {
  customerId?: string
  invoiceDate: Date
  dueDate?: Date
  items: Array<{
    productId?: string
    description: string
    quantity: number
    unitPrice: number
  }>
  notes?: string
  taxRate?: number
}) {
  const invoiceId = nanoid()
  const invoiceNumber = `INV-${Date.now()}`

  // Calculate totals. Tax is GST, expressed as a percentage of the subtotal.
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxRate = data.taxRate || 0
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100
  const total = subtotal + tax

  // Create invoice
  const invoice = await demoDb.createInvoice(businessId, {
    customerId: data.customerId,
    invoiceNumber,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    subtotal,
    taxRate,
    tax,
    total,
    notes: data.notes,
    status: 'draft',
    paidAmount: 0,
  })

  // Create invoice items and deduct stock for items linked to a product
  for (const item of data.items) {
    const amount = item.quantity * item.unitPrice
    await demoDb.createInvoiceItem(invoiceId, {
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
    })

    if (item.productId) {
      await demoDb.adjustProductStock(item.productId, -item.quantity)
    }
  }

  revalidatePath(`/dashboard/businesses/${businessId}`)
  return invoiceId
}

export async function updateInvoice(invoiceId: string, businessId: string, data: any) {
  const invoice = await demoDb.getInvoice(invoiceId)
  if (!invoice || invoice.businessId !== businessId) throw new Error('Invoice not found')

  Object.assign(invoice, data, { updatedAt: new Date() })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

export async function deleteInvoice(invoiceId: string, businessId: string) {
  const deleted = await demoDb.deleteInvoice(businessId, invoiceId)
  if (!deleted) throw new Error('Invoice not found')
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

export async function markInvoicePaid(invoiceId: string, businessId: string, paidAmount: number) {
  const invoice = await demoDb.getInvoice(invoiceId)
  if (!invoice || invoice.businessId !== businessId) throw new Error('Invoice not found')

  await demoDb.updateInvoicePayment(invoiceId, paidAmount, 'paid')
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

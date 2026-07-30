import { Fragment } from 'react'
import { formatCurrency, formatDate, invoiceReferenceLabel, splitGst, unitLabel, type CustomFieldColumn } from '@/lib/utils'

interface InvoicePrintViewProps {
  business: {
    name: string
    type?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    taxId?: string | null
  }
  customer?: {
    name: string
    taxId?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
  } | null
  invoice: {
    invoiceNumber: string
    invoiceDate: Date | string
    dueDate?: Date | string | null
    subtotal: string | number
    tax: string | number
    total: string | number
    paidAmount?: string | number | null
    notes?: string | null
    referenceNote?: string | null
    taxBreakdown?: Array<{ rate: number; taxableAmount: number; taxAmount: number }>
  }
  items: Array<{
    id: string
    description: string
    quantity: number | null
    unit?: string | null
    unitPrice: string | number
    amount: string | number
    customFields?: Record<string, string> | null
  }>
  customColumns?: CustomFieldColumn[]
}

export function InvoicePrintView({ business, customer, invoice, items, customColumns = [] }: InvoicePrintViewProps) {
  const subtotal = Number(invoice.subtotal) || 0
  const total = Number(invoice.total) || 0
  const paidAmount = Number(invoice.paidAmount) || 0
  const amountDue = total - paidAmount
  const taxBreakdown = invoice.taxBreakdown ?? []
  const referenceLabel = invoiceReferenceLabel(business.type)
  const isOffice = business.type === 'office' || business.name === 'Net-Crux'

  return (
    <div className="bg-white text-black max-w-3xl mx-auto p-10 text-sm leading-relaxed shadow-sm print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        {business.name === 'Net-Crux' ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/net-crux-logo.png" alt="Net-Crux" className="w-14 h-14 rounded-lg object-contain" />
            <span className="font-bold">Net-Crux IT Services</span>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-xl font-bold">
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-right">
          <h1 className="text-3xl font-light tracking-wide text-neutral-800">INVOICE</h1>
        </div>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div />
        <div className="text-right">
          <p className="font-bold">{business.name}</p>
          {business.taxId && <p>GSTIN: {business.taxId}</p>}
          {business.address && <p>{business.address}</p>}
          {business.phone && <p>{business.phone}</p>}
          {business.email && <p>{business.email}</p>}
        </div>
      </div>

      {/* Bill To / Invoice meta */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-neutral-300">
        <div>
          <p className="text-xs font-semibold text-neutral-500 tracking-wide mb-1">BILL TO</p>
          {customer ? (
            <>
              <p className="font-bold">{customer.name}</p>
              {customer.taxId && <p>GSTIN:- {customer.taxId}</p>}
              {customer.address && <p>{customer.address}</p>}
              {customer.phone && <p>{customer.phone}</p>}
              {customer.email && <p>{customer.email}</p>}
            </>
          ) : (
            <p className="text-neutral-500">Walk-in customer</p>
          )}
        </div>
        <div className="text-right">
          <table className="text-right">
            <tbody>
              <tr>
                <td className="pr-4 text-neutral-500">Invoice Number:</td>
                <td className="font-medium">{invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td className="pr-4 text-neutral-500">Invoice Date:</td>
                <td className="font-medium">{formatDate(invoice.invoiceDate)}</td>
              </tr>
              {invoice.dueDate && (
                <tr>
                  <td className="pr-4 text-neutral-500">Payment Due:</td>
                  <td className="font-medium">{formatDate(invoice.dueDate)}</td>
                </tr>
              )}
              {referenceLabel && invoice.referenceNote && (
                <tr>
                  <td className="pr-4 text-neutral-500">{referenceLabel}:</td>
                  <td className="font-medium">{invoice.referenceNote}</td>
                </tr>
              )}
              <tr>
                <td className="pr-4 text-neutral-500 pt-2">Amount Due (INR):</td>
                <td className="font-bold pt-2">{formatCurrency(amountDue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-neutral-800 text-left">
            <th className="pb-2 font-semibold">Product/Service</th>
            <th className="pb-2 font-semibold text-right">{isOffice ? 'Duration' : 'Quantity'}</th>
            <th className="pb-2 font-semibold text-right">Price</th>
            <th className="pb-2 font-semibold text-right">Amount</th>
            {customColumns.map((col) => (
              <th key={col.key} className="pb-2 font-semibold">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-200">
              <td className="py-3">{item.description}</td>
              <td className="py-3 text-right">{item.quantity != null ? `${item.quantity} ${unitLabel(item.unit)}` : '—'}</td>
              <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 text-right">{formatCurrency(item.amount)}</td>
              {customColumns.map((col) => (
                <td key={col.key} className="py-3">{item.customFields?.[col.key] || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <table className="text-right w-64">
          <tbody>
            <tr>
              <td className="text-neutral-500 py-1">Subtotal:</td>
              <td className="font-medium py-1">{formatCurrency(subtotal)}</td>
            </tr>
            {taxBreakdown.map((b) => {
              const { cgstRate, sgstRate, cgstAmount, sgstAmount } = splitGst(b.taxAmount, b.rate)
              return (
                <Fragment key={b.rate}>
                  <tr>
                    <td className="text-neutral-500 py-1">SGST {sgstRate}%:</td>
                    <td className="font-medium py-1">{formatCurrency(sgstAmount)}</td>
                  </tr>
                  <tr>
                    <td className="text-neutral-500 py-1">CGST {cgstRate}%:</td>
                    <td className="font-medium py-1">{formatCurrency(cgstAmount)}</td>
                  </tr>
                </Fragment>
              )
            })}
            <tr className="border-t border-neutral-300">
              <td className="font-bold pt-2">Total:</td>
              <td className="font-bold pt-2">{formatCurrency(total)}</td>
            </tr>
            <tr>
              <td className="font-bold pt-1">Amount Due (INR):</td>
              <td className="font-bold pt-1">{formatCurrency(amountDue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-neutral-500 tracking-wide mb-1">NOTES / TERMS</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

    </div>
  )
}

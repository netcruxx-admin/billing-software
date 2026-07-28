import { formatCurrency, formatDate, splitGst, unitLabel } from '@/lib/utils'

interface PurchasePrintViewProps {
  business: {
    name: string
    address?: string | null
    phone?: string | null
    email?: string | null
    taxId?: string | null
  }
  supplier?: {
    name: string
    taxId?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
  } | null
  purchase: {
    purchaseNumber: string
    challanNumber?: string | null
    purchaseDate: Date | string
    subtotal: string | number
    tax: string | number
    total: string | number
    notes?: string | null
    taxBreakdown?: Array<{ rate: number; taxableAmount: number; taxAmount: number }>
  }
  items: Array<{
    id: string
    description: string
    quantity: number
    unit?: string | null
    unitPrice: string | number
    amount: string | number
    hsnCode?: string | null
  }>
}

export function PurchasePrintView({ business, supplier, purchase, items }: PurchasePrintViewProps) {
  const subtotal = Number(purchase.subtotal) || 0
  const total = Number(purchase.total) || 0
  const taxBreakdown = purchase.taxBreakdown ?? []

  return (
    <div className="bg-white text-black max-w-3xl mx-auto p-10 text-sm leading-relaxed shadow-sm print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="w-14 h-14 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-xl font-bold">
          {business.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-light tracking-wide text-neutral-800">PURCHASE CHALLAN</h1>
        </div>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div />
        <div className="text-right">
          <p className="font-bold">{business.name}</p>
          {business.address && <p>{business.address}</p>}
          {business.phone && <p>{business.phone}</p>}
          {business.email && <p>{business.email}</p>}
        </div>
      </div>

      {/* Supplier / Purchase meta */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-neutral-300">
        <div>
          <p className="text-xs font-semibold text-neutral-500 tracking-wide mb-1">RECEIVED FROM</p>
          {supplier ? (
            <>
              <p className="font-bold">{supplier.name}</p>
              {supplier.taxId && <p>GSTIN:- {supplier.taxId}</p>}
              {supplier.address && <p>{supplier.address}</p>}
              {supplier.phone && <p>{supplier.phone}</p>}
              {supplier.email && <p>{supplier.email}</p>}
            </>
          ) : (
            <p className="text-neutral-500">No supplier on file</p>
          )}
        </div>
        <div className="text-right">
          <table className="text-right">
            <tbody>
              <tr>
                <td className="pr-4 text-neutral-500">Purchase Number:</td>
                <td className="font-medium">{purchase.purchaseNumber}</td>
              </tr>
              <tr>
                <td className="pr-4 text-neutral-500">Purchase Date:</td>
                <td className="font-medium">{formatDate(purchase.purchaseDate)}</td>
              </tr>
              {purchase.challanNumber && (
                <tr>
                  <td className="pr-4 text-neutral-500">Supplier Challan/Bill No.:</td>
                  <td className="font-medium">{purchase.challanNumber}</td>
                </tr>
              )}
              <tr>
                <td className="pr-4 text-neutral-500 pt-2">Total (INR):</td>
                <td className="font-bold pt-2">{formatCurrency(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-neutral-800 text-left">
            <th className="pb-2 font-semibold">Item</th>
            <th className="pb-2 font-semibold">HSN</th>
            <th className="pb-2 font-semibold text-right">Quantity</th>
            <th className="pb-2 font-semibold text-right">Cost / Unit</th>
            <th className="pb-2 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-200">
              <td className="py-3">{item.description}</td>
              <td className="py-3">{item.hsnCode ?? '—'}</td>
              <td className="py-3 text-right">{item.quantity} {unitLabel(item.unit)}</td>
              <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 text-right">{formatCurrency(item.amount)}</td>
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
                <tr key={b.rate}>
                  <td className="text-neutral-500 py-1">SGST {sgstRate}% + CGST {cgstRate}%:</td>
                  <td className="font-medium py-1">{formatCurrency(sgstAmount + cgstAmount)}</td>
                </tr>
              )
            })}
            <tr className="border-t border-neutral-300">
              <td className="font-bold pt-2">Total:</td>
              <td className="font-bold pt-2">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {purchase.notes && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-neutral-500 tracking-wide mb-1">NOTES</p>
          <p className="whitespace-pre-wrap">{purchase.notes}</p>
        </div>
      )}

      {business.taxId && (
        <div className="pt-6 border-t border-neutral-300 text-xs text-neutral-500">
          <p>GSTIN: {business.taxId}</p>
        </div>
      )}
    </div>
  )
}

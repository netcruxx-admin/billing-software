import { formatCurrency, formatDate, groupByTaxRateIncludingZero, numberToWords, paymentModeLabel, retailQtyLabel, splitGst } from '@/lib/utils'

interface InvoicePrintViewRetailProps {
  business: {
    name: string
    type?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    taxId?: string | null
    fssaiNo?: string | null
    cstDate?: string | null
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
    deliveryDate?: Date | string | null
    paymentMode?: string | null
    subtotal: string | number
    tax: string | number
    total: string | number
    paidAmount?: string | number | null
    notes?: string | null
  }
  items: Array<{
    id: string
    description: string
    quantity: number | null
    unit?: string | null
    unitPrice: string | number
    amount: string | number
    taxRate?: number | null
    taxAmount?: string | number | null
    hsnCode?: string | null
    mrp?: string | number | null
    packSize?: string | null
    categoryName?: string | null
    cdRate?: number | null
    giftNote?: string | null
    discountAmount?: string | number | null
  }>
}

const th = 'border border-neutral-800 py-1.5 px-2 font-semibold bg-neutral-100'
const td = 'border border-neutral-400 py-1 px-2'

export function InvoicePrintViewRetail({ business, customer, invoice, items }: InvoicePrintViewRetailProps) {
  const subtotal = Number(invoice.subtotal) || 0
  const total = Number(invoice.total) || 0
  const roundedTotal = Math.round(total)
  const roundOff = Math.round((roundedTotal - total) * 100) / 100
  const taxBuckets = groupByTaxRateIncludingZero(items)
  const totalTax = taxBuckets.reduce((sum, b) => sum + b.taxAmount, 0)

  return (
    <div className="bg-white text-black max-w-4xl mx-auto p-8 text-xs leading-relaxed shadow-sm print:shadow-none border border-neutral-800">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-neutral-800 pb-2 mb-2">
        <p>GST No. :{business.taxId || '—'}</p>
        <h1 className="text-lg font-bold tracking-wide">TAX INVOICE</h1>
        <p>{business.phone ? `PH ${business.phone}` : ''}</p>
      </div>

      <div className="text-center border-b border-neutral-800 pb-2 mb-2">
        <h2 className="text-2xl font-bold">{business.name}</h2>
        {business.address && <p>{business.address}</p>}
        <div className="flex justify-between text-[11px] mt-1">
          <span>{business.cstDate ? `CST DT. :${formatDate(business.cstDate)}` : ''}</span>
          <span>{business.fssaiNo ? `FSSAI NO- ${business.fssaiNo}` : ''}</span>
        </div>
      </div>

      {/* Bill meta */}
      <div className="flex items-start justify-between border-b border-neutral-800 pb-2 mb-2">
        <div>
          <p className="font-semibold">M/S : {customer?.name ?? 'CUSTOMER'}</p>
          {customer?.taxId && <p>GST No.: {customer.taxId}</p>}
          {customer?.address && <p>{customer.address}</p>}
          {customer?.phone && <p>Phone No.: {customer.phone}</p>}
        </div>
        <table className="text-right">
          <tbody>
            <tr>
              <td className="pr-4 text-neutral-500">Bill No.:</td>
              <td className="font-medium">{invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td className="pr-4 text-neutral-500">Date:</td>
              <td className="font-medium">{formatDate(invoice.invoiceDate)}</td>
            </tr>
            {invoice.deliveryDate && (
              <tr>
                <td className="pr-4 text-neutral-500">Delivery Date:</td>
                <td className="font-medium">{formatDate(invoice.deliveryDate)}</td>
              </tr>
            )}
            {invoice.paymentMode && (
              <tr>
                <td className="pr-4 text-neutral-500">Mode:</td>
                <td className="font-medium">{paymentModeLabel(invoice.paymentMode) ?? invoice.paymentMode}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Items */}
      <table className="w-full mb-2 border-collapse">
        <thead>
          <tr className="text-left">
            <th className={`${th} text-center`}>SN</th>
            <th className={th}>Item Name</th>
            <th className={th}>Category</th>
            <th className={th}>HSN Code</th>
            <th className={th}>Pack</th>
            <th className={`${th} text-right`}>MRP</th>
            <th className={`${th} text-right`}>Qty</th>
            <th className={`${th} text-right`}>Rate</th>
            <th className={`${th} text-right`}>CD%</th>
            <th className={th}>Gift</th>
            <th className={`${th} text-right`}>Tax%</th>
            <th className={`${th} text-right`}>Gross Amt</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const amount = Number(item.amount) || 0
            const discountAmount = Number(item.discountAmount) || 0
            const grossAmt = amount + discountAmount
            return (
              <tr key={item.id}>
                <td className={`${td} text-center`}>{index + 1}</td>
                <td className={td}>{item.description}</td>
                <td className={td}>{item.categoryName || '—'}</td>
                <td className={td}>{item.hsnCode || '—'}</td>
                <td className={td}>{item.packSize || '—'}</td>
                <td className={`${td} text-right`}>{item.mrp != null ? formatCurrency(item.mrp) : '—'}</td>
                <td className={`${td} text-right`}>{retailQtyLabel(item.quantity, item.unit)}</td>
                <td className={`${td} text-right`}>{formatCurrency(item.unitPrice)}</td>
                <td className={`${td} text-right`}>{(Number(item.cdRate) || 0).toFixed(2)}</td>
                <td className={td}>{item.giftNote || '—'}</td>
                <td className={`${td} text-right`}>{(Number(item.taxRate) || 0).toFixed(2)}</td>
                <td className={`${td} text-right`}>{formatCurrency(grossAmt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Totals + GST summary */}
      <div className="flex items-start justify-between gap-6 border-t-2 border-neutral-800 pt-2 mb-2">
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-neutral-500 tracking-wide mb-1">GST-RATE-WISE SUMMARY</p>
          <table className="text-left w-full">
            <thead>
              <tr className="border-b border-neutral-400">
                <th className="py-0.5 pr-2 font-medium">Rate</th>
                <th className="py-0.5 pr-2 font-medium text-right">Taxable Amt</th>
                <th className="py-0.5 pr-2 font-medium text-right">SGST</th>
                <th className="py-0.5 pr-2 font-medium text-right">CGST</th>
              </tr>
            </thead>
            <tbody>
              {taxBuckets.map((b) => {
                const { sgstAmount, cgstAmount } = splitGst(b.taxAmount, b.rate)
                return (
                  <tr key={b.rate}>
                    <td className="py-0.5 pr-2">{b.rate === 0 ? 'GST Sale Taxfree' : `GST Sale ${b.rate}%`}</td>
                    <td className="py-0.5 pr-2 text-right">{formatCurrency(b.taxableAmount)}</td>
                    <td className="py-0.5 pr-2 text-right">{b.rate === 0 ? '—' : formatCurrency(sgstAmount)}</td>
                    <td className="py-0.5 pr-2 text-right">{b.rate === 0 ? '—' : formatCurrency(cgstAmount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <table className="text-right w-64 shrink-0">
          <tbody>
            <tr>
              <td className="text-neutral-500 py-0.5">Total:</td>
              <td className="font-medium py-0.5">{formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td className="text-neutral-500 py-0.5">SGST:</td>
              <td className="font-medium py-0.5">{formatCurrency(totalTax / 2)}</td>
            </tr>
            <tr>
              <td className="text-neutral-500 py-0.5">CGST:</td>
              <td className="font-medium py-0.5">{formatCurrency(totalTax / 2)}</td>
            </tr>
            <tr>
              <td className="text-neutral-500 py-0.5">Round Off:</td>
              <td className="font-medium py-0.5">{formatCurrency(roundOff)}</td>
            </tr>
            <tr className="border-t border-neutral-300">
              <td className="font-bold pt-1">Net Amount:</td>
              <td className="font-bold pt-1">{formatCurrency(roundedTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-t border-neutral-300 pt-2 mb-4">
        <p>Rs.: {numberToWords(roundedTotal)} Only</p>
      </div>

      {invoice.notes && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-neutral-500 tracking-wide mb-1">NOTES / TERMS</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      <p className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-300">E. &amp; O.E.</p>
    </div>
  )
}

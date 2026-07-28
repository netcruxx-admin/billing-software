import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceById, getInvoiceItems } from '@/app/actions/invoices'
import { getPaymentHistory } from '@/app/actions/payments'
import { getBusiness } from '@/app/actions/businesses'
import { getCustomer } from '@/app/actions/customers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PaymentForm } from '@/components/payment-form'
import { InvoicePrintView } from '@/components/invoice-print-view'
import { InvoicePrintViewRetail } from '@/components/invoice-print-view-retail'
import { formatCurrency, groupByTaxRateIncludingZero, invoiceLayout, paymentMethodLabel, splitGst } from '@/lib/utils'

type InvoiceDetailPageProps = {
  params: Promise<{ id: string; invoiceId: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id, invoiceId } = await params

  try {
    const [invoiceData, items, payments, business] = await Promise.all([
      getInvoiceById(invoiceId, id),
      getInvoiceItems(invoiceId, id),
      getPaymentHistory(invoiceId, id),
      getBusiness(id),
    ])

    let customer = null
    if (invoiceData.customerId) {
      try {
        customer = await getCustomer(invoiceData.customerId, id)
      } catch {
        customer = null
      }
    }

    const statusColor =
      invoiceData.status === 'paid'
        ? 'bg-green-100 text-green-800'
        : invoiceData.status === 'partial'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-blue-100 text-blue-800'

    const totalAmount = parseFloat(invoiceData.total as any)
    const paidAmount = parseFloat(invoiceData.paidAmount as any) || 0
    const subtotalAmount = parseFloat(invoiceData.subtotal as any) || 0
    const layout = invoiceLayout(business.type)
    const roundedTotal = Math.round(totalAmount)
    const roundOff = Math.round((roundedTotal - totalAmount) * 100) / 100
    const retailTaxBuckets = layout === 'retail' ? groupByTaxRateIncludingZero(items) : []
    const retailTotalTax = retailTaxBuckets.reduce((sum, b) => sum + b.taxAmount, 0)
    // The invoice itself displays the round-off-adjusted total as the amount
    // owed for retail businesses — payment tracking has to agree with that
    // number, not the raw pre-round-off backend total.
    const displayTotal = layout === 'retail' ? roundedTotal : totalAmount
    const remainingAmount = displayTotal - paidAmount

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link href={`/dashboard/businesses/${id}`} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
                  ← Back to Business
                </Link>
                <h1 className="text-4xl font-bold text-foreground">
                  Invoice {invoiceData.invoiceNumber}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor}>{invoiceData.status.toUpperCase()}</Badge>
                <Link href={`/dashboard/businesses/${id}/invoices/${invoiceId}/print`}>
                  <Button variant="outline">Print / Download PDF</Button>
                </Link>
              </div>
            </div>

            {/* Bill — same layout as Print / Download PDF */}
            <div className="mb-8">
              {layout === 'retail' ? (
                <InvoicePrintViewRetail business={business} customer={customer} invoice={invoiceData} items={items} />
              ) : (
                <InvoicePrintView business={business} customer={customer} invoice={invoiceData} items={items} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Payment History */}
              <div className="lg:col-span-2 space-y-8">
                {payments.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Payment History</h2>
                    <div className="space-y-2">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded">
                          <div>
                            <p className="font-medium text-foreground">{paymentMethodLabel(p.method)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600">
                            +{formatCurrency(p.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-6 sticky top-8">
                  <h2 className="text-lg font-semibold text-foreground mb-6">Payment Summary</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(subtotalAmount)}
                      </span>
                    </div>
                    {layout === 'retail' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SGST</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(retailTotalTax / 2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CGST</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(retailTotalTax / 2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Round Off</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(roundOff)}
                          </span>
                        </div>
                      </>
                    ) : (
                      invoiceData.taxBreakdown.map((b) => {
                        const { sgstRate, cgstRate, sgstAmount, cgstAmount } = splitGst(b.taxAmount, b.rate)
                        return (
                          <div key={b.rate} className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">SGST {sgstRate}%</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(sgstAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CGST {cgstRate}%</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(cgstAmount)}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold text-foreground">{layout === 'retail' ? 'Net Amount' : 'Total'}</span>
                      <span className="font-semibold text-foreground text-lg">
                        {formatCurrency(displayTotal)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(paidAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {remainingAmount > 0 && invoiceData.status !== 'paid' && (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6">
                        <p className="text-sm font-medium text-yellow-900">
                          Amount Due: {formatCurrency(remainingAmount)}
                        </p>
                      </div>
                      <PaymentForm
                        invoiceId={invoiceId}
                        businessId={id}
                        amount={remainingAmount}
                      />
                    </>
                  )}

                  {invoiceData.status === 'paid' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm font-medium text-green-900">✓ Invoice Paid</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    )
  } catch (error) {
    console.error('Failed to load invoice:', error)
    redirect(`/dashboard/businesses/${id}`)
  }
}

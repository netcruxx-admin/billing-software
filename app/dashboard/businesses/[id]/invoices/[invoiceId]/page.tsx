import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceById, getInvoiceItems } from '@/app/actions/invoices'
import { getPaymentHistory } from '@/app/actions/payments'
import { Badge } from '@/components/ui/badge'
import { PaymentForm } from '@/components/payment-form'
import { formatCurrency } from '@/lib/utils'

type InvoiceDetailPageProps = {
  params: Promise<{ id: string; invoiceId: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id, invoiceId } = await params

  try {
    const [invoiceData, items, payments] = await Promise.all([
      getInvoiceById(invoiceId, id),
      getInvoiceItems(invoiceId),
      getPaymentHistory(invoiceId, id),
    ])

    const statusColor =
      invoiceData.status === 'paid'
        ? 'bg-green-100 text-green-800'
        : invoiceData.status === 'partial'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-blue-100 text-blue-800'

    const totalAmount = parseFloat(invoiceData.total as any)
    const paidAmount = parseFloat(invoiceData.paidAmount as any) || 0
    const remainingAmount = totalAmount - paidAmount
    const subtotalAmount = parseFloat(invoiceData.subtotal as any) || 0
    const taxAmount = parseFloat(invoiceData.tax as any) || 0
    const taxRate =
      invoiceData.taxRate != null
        ? Number(invoiceData.taxRate)
        : subtotalAmount > 0
          ? Math.round((taxAmount / subtotalAmount) * 10000) / 100
          : 0

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
              <Badge className={statusColor}>{invoiceData.status.toUpperCase()}</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Invoice Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Invoice Info */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Invoice Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Date</p>
                      <p className="font-medium text-foreground">
                        {new Date(invoiceData.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium text-foreground">
                        {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded">
                        <div>
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment History */}
                {payments.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Payment History</h2>
                    <div className="space-y-2">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded">
                          <div>
                            <p className="font-medium text-foreground capitalize">{p.method}</p>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST ({taxRate}%)</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-foreground">Total</span>
                        <span className="font-semibold text-foreground text-lg">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
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

import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { getInvoiceById, getInvoiceItems } from '@/app/actions/invoices'
import { getCustomer } from '@/app/actions/customers'
import { getInvoiceColumns } from '@/app/actions/invoice-columns'
import { InvoicePrintView } from '@/components/invoice-print-view'
import { InvoicePrintViewRetail } from '@/components/invoice-print-view-retail'
import { InvoicePrintActions } from '@/components/invoice-print-actions'
import { invoiceLayout, resolveCustomFieldColumns } from '@/lib/utils'

type InvoicePrintPageProps = {
  params: Promise<{ id: string; invoiceId: string }>
}

export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  const { id, invoiceId } = await params

  try {
    const [business, invoice, items] = await Promise.all([
      getBusiness(id),
      getInvoiceById(invoiceId, id),
      getInvoiceItems(invoiceId, id),
    ])
    // Custom invoice columns are an optional enhancement — don't let a
    // failure here (e.g. backend not yet migrated) break printing.
    const invoiceColumns = await getInvoiceColumns(id).catch(() => [])
    const customColumns = resolveCustomFieldColumns(items, invoiceColumns)

    let customer = null
    if (invoice.customerId) {
      try {
        customer = await getCustomer(invoice.customerId, id)
      } catch {
        customer = null
      }
    }

    return (
      <div className="bg-neutral-100 min-h-svh print:bg-white">
        <InvoicePrintActions
          invoiceUrl={`/dashboard/businesses/${id}/invoices/${invoiceId}`}
          fileName={`invoice-${invoice.invoiceNumber}.pdf`}
          business={business}
          customer={customer}
          invoice={invoice}
          items={items}
          customColumns={customColumns}
        />
        <div className="py-10 print:py-0">
          {invoiceLayout(business.type) === 'retail' ? (
            <InvoicePrintViewRetail business={business} customer={customer} invoice={invoice} items={items} customColumns={customColumns} />
          ) : (
            <InvoicePrintView business={business} customer={customer} invoice={invoice} items={items} customColumns={customColumns} />
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load invoice for printing:', error)
    redirect(`/dashboard/businesses/${id}/invoices/${invoiceId}`)
  }
}

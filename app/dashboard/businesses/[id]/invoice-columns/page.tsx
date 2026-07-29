import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { getInvoiceColumns } from '@/app/actions/invoice-columns'
import { InvoiceColumnManager } from '@/components/invoice-column-manager'

type InvoiceColumnsPageProps = {
  params: Promise<{ id: string }>
}

export default async function InvoiceColumnsPage({ params }: InvoiceColumnsPageProps) {
  const { id: businessId } = await params

  try {
    const [business, columns] = await Promise.all([getBusiness(businessId), getInvoiceColumns(businessId)])

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Invoice Columns</h1>
            <p className="text-muted-foreground mt-2">
              Custom columns for {business.name}&apos;s invoice item table — they appear after the standard fields on
              every new invoice, and their values are saved with the invoice.
            </p>
          </div>
          <InvoiceColumnManager businessId={businessId} columns={columns} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load invoice columns:', error)
    redirect(`/dashboard/businesses/${businessId}`)
  }
}

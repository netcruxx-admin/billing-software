import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { InvoiceForm } from '@/components/invoice-form'
import { getCustomers } from '@/app/actions/customers'
import { getProducts } from '@/app/actions/products'

type NewInvoicePageProps = {
  params: Promise<{ id: string }>
}

export default async function NewInvoicePage({ params }: NewInvoicePageProps) {
  const { id } = await params

  try {
    const [business, customers, products] = await Promise.all([
      getBusiness(id),
      getCustomers(id),
      getProducts(id),
    ])

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Create Invoice</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <InvoiceForm businessId={id} business={business} customers={customers} products={products} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

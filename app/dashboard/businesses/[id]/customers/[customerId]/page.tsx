import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { getCustomer } from '@/app/actions/customers'
import { CustomerForm } from '@/components/customer-form'

type EditCustomerPageProps = {
  params: Promise<{ id: string; customerId: string }>
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id, customerId } = await params

  try {
    const [business, customer] = await Promise.all([
      getBusiness(id),
      getCustomer(customerId, id),
    ])

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Edit Customer</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <CustomerForm businessId={id} customer={customer} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

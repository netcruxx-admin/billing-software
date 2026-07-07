import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { CustomerForm } from '@/components/customer-form'

type NewCustomerPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewCustomerPage({ params }: NewCustomerPageProps) {
  const { id } = await params

  try {
    const business = await getBusiness(id)

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Add Customer</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <CustomerForm businessId={id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

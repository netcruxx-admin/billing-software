import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { SupplierForm } from '@/components/supplier-form'

type NewSupplierPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewSupplierPage({ params }: NewSupplierPageProps) {
  const { id } = await params

  try {
    const business = await getBusiness(id)

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Add Supplier</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <SupplierForm businessId={id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

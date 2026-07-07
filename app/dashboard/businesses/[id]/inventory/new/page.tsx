import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { ProductForm } from '@/components/product-form'

type NewProductPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { id } = await params

  try {
    const business = await getBusiness(id)

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Add Product</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <ProductForm businessId={id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

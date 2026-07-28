import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { PurchaseForm } from '@/components/purchase-form'
import { getSuppliers } from '@/app/actions/suppliers'
import { getProducts } from '@/app/actions/products'

type NewPurchasePageProps = {
  params: Promise<{ id: string }>
}

export default async function NewPurchasePage({ params }: NewPurchasePageProps) {
  const { id } = await params

  try {
    const [business, suppliers, products] = await Promise.all([
      getBusiness(id),
      getSuppliers(id),
      getProducts(id),
    ])

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Record Purchase</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <PurchaseForm businessId={id} suppliers={suppliers} products={products} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

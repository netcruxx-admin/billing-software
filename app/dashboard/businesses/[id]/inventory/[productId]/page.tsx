import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { getProduct } from '@/app/actions/products'
import { getCategories } from '@/app/actions/categories'
import { ProductForm } from '@/components/product-form'

type EditProductPageProps = {
  params: Promise<{ id: string; productId: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id, productId } = await params

  try {
    const [business, product, categories] = await Promise.all([
      getBusiness(id),
      getProduct(productId, id),
      getCategories(id),
    ])

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Edit Product</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <ProductForm businessId={id} categories={categories} product={product} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

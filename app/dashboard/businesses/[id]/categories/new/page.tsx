import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { CategoryForm } from '@/components/category-form'

type NewCategoryPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewCategoryPage({ params }: NewCategoryPageProps) {
  const { id } = await params

  try {
    const business = await getBusiness(id)

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Add Category</h1>
            <p className="text-muted-foreground mt-2">for {business.name}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <CategoryForm businessId={id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

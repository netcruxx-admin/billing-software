import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { BusinessForm } from '@/components/business-form'

type EditBusinessPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditBusinessPage({ params }: EditBusinessPageProps) {
  const { id } = await params

  try {
    const business = await getBusiness(id)

    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Edit Business</h1>
            <p className="text-muted-foreground mt-2">
              Update {business.name}&apos;s details — this is what appears on your invoices.
            </p>
          </div>

          <BusinessForm business={business} />
        </div>
      </div>
    )
  } catch (error) {
    redirect(`/dashboard/businesses/${id}`)
  }
}

import { BusinessForm } from '@/components/business-form'

export default function NewBusinessPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Create Business</h1>
          <p className="text-muted-foreground mt-2">Set up a new business account</p>
        </div>

        <BusinessForm />
      </div>
    </div>
  )
}

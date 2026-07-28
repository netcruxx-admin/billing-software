import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getBusiness } from '@/app/actions/businesses'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  const { id } = await params

  // Only used to pick which business-type-flavored labels the sidebar
  // shows — if the lookup fails, the page content itself (which also
  // fetches the business) will redirect with a proper error.
  const business = await getBusiness(id).catch(() => null)

  return (
    <div className="min-h-svh bg-background">
      <div className="print:hidden">
        <DashboardHeader user={session.user} />
      </div>
      <div className="flex">
        <div className="print:hidden">
          <DashboardSidebar businessId={id} businessType={business?.type} />
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

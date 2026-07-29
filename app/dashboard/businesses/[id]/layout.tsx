import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getBusiness } from '@/app/actions/businesses'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { SidebarProvider } from '@/components/sidebar-provider'

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
    <SidebarProvider>
      <div className="h-svh flex flex-col bg-background print:h-auto print:block">
        <div className="print:hidden shrink-0">
          <DashboardHeader user={session.user} />
        </div>
        <div className="flex flex-1 min-h-0 print:block">
          <div className="print:hidden">
            <DashboardSidebar businessId={id} businessType={business?.type} />
          </div>
          <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

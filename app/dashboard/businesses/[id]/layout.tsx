import { redirect } from 'next/navigation'
import { getDemoSession } from '@/lib/demo-auth'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const session = await getDemoSession()
  if (!session?.user) redirect('/sign-in')

  const { id } = await params

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader user={session.user} />
      <div className="flex">
        <DashboardSidebar businessId={id} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

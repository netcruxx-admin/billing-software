import { redirect } from 'next/navigation'
import { getDemoSession } from '@/lib/demo-auth'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

export default async function NewBusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getDemoSession()
  if (!session?.user) redirect('/sign-in')

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader user={session.user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

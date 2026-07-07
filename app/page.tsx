import { redirect } from 'next/navigation'
import { getDemoSession } from '@/lib/demo-auth'
import { getBusinesses } from './actions/businesses'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { BusinessCard } from '@/components/business-card'

export default async function Home() {
  const session = await getDemoSession()
  if (!session?.user) redirect('/sign-in')

  let businesses: any[] = []
  try {
    businesses = await getBusinesses()
  } catch (error) {
    console.log('Database connection error:', error)
    // Show demo mode - no businesses but app is functional
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader user={session.user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage your businesses and track billing</p>
            </div>

            {businesses.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">No businesses yet</h2>
                <p className="text-muted-foreground mb-6">Create your first business to get started</p>
                <a href="/dashboard/businesses/new" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
                  Create Business
                </a>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Your Businesses</h2>
                  <a href="/dashboard/businesses/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm">
                    New Business
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.map((b) => (
                    <BusinessCard key={b.id} business={b} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

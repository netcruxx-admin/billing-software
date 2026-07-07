import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getAnalytics,
  getMonthlyRevenue,
  getInvoiceStatusBreakdown,
} from '@/app/actions/analytics'
import { AnalyticsCharts } from '@/components/analytics-charts'
import { formatCurrency } from '@/lib/utils'

type AnalyticsPageProps = {
  params: Promise<{ id: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params

  try {
    const [analyticsData, monthlyRevenue, statusBreakdown] = await Promise.all([
      getAnalytics(id),
      getMonthlyRevenue(id),
      getInvoiceStatusBreakdown(id),
    ])

    const { metrics } = analyticsData

    const statusData = [
      { name: 'Draft', value: statusBreakdown.draft },
      { name: 'Sent', value: statusBreakdown.sent },
      { name: 'Partial', value: statusBreakdown.partial },
      { name: 'Paid', value: statusBreakdown.paid },
    ].filter((d) => d.value > 0)

    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href={`/dashboard/businesses/${id}`} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
              ← Back to Business
            </Link>
            <h1 className="text-4xl font-bold text-foreground">Sales Analytics</h1>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(metrics.totalPaid)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Outstanding</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(metrics.outstandingAmount)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Invoices</p>
                <p className="text-3xl font-bold text-foreground">
                  {metrics.totalInvoices}
                </p>
              </div>
            </div>

            <AnalyticsCharts monthlyRevenue={monthlyRevenue} statusData={statusData} />

            {/* Invoice Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.paidInvoices} / {metrics.totalInvoices}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Unpaid Invoices</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.unpaidInvoices} / {metrics.totalInvoices}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Payment Rate
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.totalInvoices > 0
                    ? (
                        (metrics.paidInvoices / metrics.totalInvoices) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
    )
  } catch (error) {
    console.error('Failed to load analytics:', error)
    redirect(`/dashboard/businesses/${id}`)
  }
}

'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Columns3,
  FileText,
  LayoutDashboard,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { dashboardModuleLabels } from '@/lib/utils'
import { useSidebar } from '@/components/sidebar-provider'
import { Button } from '@/components/ui/button'

interface DashboardSidebarProps {
  businessId?: string
  businessType?: string | null
}

export function DashboardSidebar({ businessId, businessType }: DashboardSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab')
  const modules = dashboardModuleLabels(businessType)
  const { collapsed, toggle } = useSidebar()

  const navItems: { label: string; href: string; match: (p: string) => boolean; icon: LucideIcon }[] = businessId
    ? [
        { label: 'Overview', href: `/dashboard/businesses/${businessId}`, match: (p) => p === `/dashboard/businesses/${businessId}` && !activeTab, icon: LayoutDashboard },
        { label: 'Invoices', href: `/dashboard/businesses/${businessId}?tab=invoices`, match: () => activeTab === 'invoices', icon: FileText },
        { label: modules.inventory.label, href: `/dashboard/businesses/${businessId}?tab=inventory`, match: () => activeTab === 'inventory', icon: modules.inventory.icon },
        { label: 'Purchases', href: `/dashboard/businesses/${businessId}?tab=purchases`, match: () => activeTab === 'purchases', icon: ShoppingBag },
        { label: 'Customers', href: `/dashboard/businesses/${businessId}?tab=customers`, match: () => activeTab === 'customers', icon: Users },
        { label: 'Payments', href: `/dashboard/businesses/${businessId}?tab=payments`, match: () => activeTab === 'payments', icon: Wallet },
        { label: 'Analytics', href: `/dashboard/businesses/${businessId}/analytics`, match: (p) => p === `/dashboard/businesses/${businessId}/analytics`, icon: LineChart },
      ]
    : [
        { label: 'Dashboard', href: '/', match: (p) => p === '/', icon: LayoutDashboard },
        { label: 'New Business', href: '/dashboard/businesses/new', match: (p) => p === '/dashboard/businesses/new', icon: Plus },
      ]

  return (
    <aside
      className={`relative shrink-0 border-r border-border bg-card h-full transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3.5 top-6 z-10 size-7 rounded-full bg-card shadow-sm text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
      </Button>
      <div className="h-full overflow-y-auto overflow-x-hidden p-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${collapsed ? 'justify-center px-0' : ''} ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        {businessId && (
          <div className="mt-6 pt-6 border-t border-border space-y-1">
            <Link
              href={`/dashboard/businesses/${businessId}/invoice-columns`}
              title={collapsed ? 'Invoice Columns' : undefined}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm ${collapsed ? 'justify-center px-0' : ''} ${
                pathname === `/dashboard/businesses/${businessId}/invoice-columns`
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Columns3 className="size-4 shrink-0" />
              {!collapsed && <span>Invoice Columns</span>}
            </Link>
            <Link
              href="/"
              title={collapsed ? 'All Businesses' : undefined}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent transition text-sm ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <ArrowLeft className="size-4 shrink-0" />
              {!collapsed && <span>All Businesses</span>}
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}

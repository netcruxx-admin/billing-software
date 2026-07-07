'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface DashboardSidebarProps {
  businessId?: string
}

export function DashboardSidebar({ businessId }: DashboardSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab')

  const navItems = businessId
    ? [
        { label: 'Overview', href: `/dashboard/businesses/${businessId}`, match: (p: string) => p === `/dashboard/businesses/${businessId}` && !activeTab, icon: '🏠' },
        { label: 'Invoices', href: `/dashboard/businesses/${businessId}?tab=invoices`, match: () => activeTab === 'invoices', icon: '📄' },
        { label: 'Inventory', href: `/dashboard/businesses/${businessId}?tab=inventory`, match: () => activeTab === 'inventory', icon: '📦' },
        { label: 'Customers', href: `/dashboard/businesses/${businessId}?tab=customers`, match: () => activeTab === 'customers', icon: '👥' },
        { label: 'Payments', href: `/dashboard/businesses/${businessId}?tab=payments`, match: () => activeTab === 'payments', icon: '💳' },
        { label: 'Analytics', href: `/dashboard/businesses/${businessId}/analytics`, match: (p: string) => p === `/dashboard/businesses/${businessId}/analytics`, icon: '📈' },
      ]
    : [
        { label: 'Dashboard', href: '/', match: (p: string) => p === '/', icon: '📊' },
        { label: 'New Business', href: '/dashboard/businesses/new', match: (p: string) => p === '/dashboard/businesses/new', icon: '➕' },
      ]

  return (
    <aside className="w-64 border-r border-border bg-card h-[calc(100vh-73px)] sticky top-[73px] p-4">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = item.match(pathname)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      {businessId && (
        <div className="mt-6 pt-6 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent transition text-sm"
          >
            <span>←</span>
            <span>All Businesses</span>
          </Link>
        </div>
      )}
    </aside>
  )
}

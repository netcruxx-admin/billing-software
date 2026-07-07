'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BusinessCardProps {
  business: {
    id: string
    name: string
    type: string
    email?: string | null
    phone?: string | null
  }
}

export function BusinessCard({ business }: BusinessCardProps) {
  const router = useRouter()

  const getBusinessTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'restaurant':
        return '🍽️'
      case 'bar':
        return '🍹'
      case 'hotel':
        return '🏨'
      case 'store':
      case 'general store':
        return '🛒'
      default:
        return '💼'
    }
  }

  return (
    <div
      onClick={() => router.push(`/dashboard/businesses/${business.id}`)}
      className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition cursor-pointer h-full"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{getBusinessTypeIcon(business.type)}</div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground">{business.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{business.type}</p>
        </div>
      </div>

      {(business.email || business.phone) && (
        <div className="text-sm text-muted-foreground space-y-1">
          {business.email && <p>📧 {business.email}</p>}
          {business.phone && <p>📱 {business.phone}</p>}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border flex gap-2">
        <Link
          href={`/dashboard/businesses/${business.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition text-sm font-medium text-center"
        >
          View Details
        </Link>
        <Link
          href={`/dashboard/businesses/${business.id}/invoices/new`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-3 py-2 bg-accent text-foreground rounded hover:bg-accent/80 transition text-sm font-medium text-center"
        >
          New Invoice
        </Link>
      </div>
    </div>
  )
}

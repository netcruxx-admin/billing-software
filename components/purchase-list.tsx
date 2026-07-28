'use client'

import Link from 'next/link'
import { DeleteButton } from '@/components/delete-button'
import { deletePurchase } from '@/app/actions/purchases'
import { formatCurrency } from '@/lib/utils'

interface Purchase {
  id: string
  purchaseNumber: string
  challanNumber?: string | null
  purchaseDate: Date | string
  total: string | number
  supplierName?: string | null
}

interface PurchaseListProps {
  purchases: Purchase[]
  businessId: string
}

export function PurchaseList({ purchases, businessId }: PurchaseListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Purchase #</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Supplier</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} className="border-b border-border hover:bg-accent/50 transition">
              <td className="py-4 px-4 text-foreground font-medium">
                {p.purchaseNumber}
                {p.challanNumber && (
                  <span className="block text-xs text-muted-foreground">Challan: {p.challanNumber}</span>
                )}
              </td>
              <td className="py-4 px-4 text-muted-foreground">{p.supplierName ?? '—'}</td>
              <td className="py-4 px-4 text-muted-foreground">
                {new Date(p.purchaseDate).toLocaleDateString()}
              </td>
              <td className="py-4 px-4 text-foreground font-semibold">
                {formatCurrency(p.total)}
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/businesses/${businessId}/purchases/${p.id}`}>
                    <button className="text-primary hover:text-primary/80 text-sm font-medium px-2">
                      View
                    </button>
                  </Link>
                  <DeleteButton
                    action={() => deletePurchase(p.id, businessId)}
                    confirmMessage={`Delete purchase ${p.purchaseNumber}? This cannot be undone.`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

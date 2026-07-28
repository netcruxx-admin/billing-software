'use client'

import { DeleteButton } from '@/components/delete-button'
import { deleteSupplier } from '@/app/actions/suppliers'

interface Supplier {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface SupplierListProps {
  suppliers: Supplier[]
  businessId: string
}

export function SupplierList({ suppliers, businessId }: SupplierListProps) {
  return (
    <div className="space-y-2">
      {suppliers.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between p-4 border border-border rounded hover:bg-accent/50"
        >
          <div>
            <p className="font-medium text-foreground">{s.name}</p>
            {s.email && <p className="text-sm text-muted-foreground">{s.email}</p>}
          </div>
          <div className="flex items-center gap-4">
            {s.phone && <p className="text-sm text-muted-foreground">{s.phone}</p>}
            <DeleteButton
              action={() => deleteSupplier(s.id, businessId)}
              confirmMessage={`Delete ${s.name}? This cannot be undone.`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

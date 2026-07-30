'use client'

import Link from 'next/link'
import { DeleteButton } from '@/components/delete-button'
import { deleteCustomer } from '@/app/actions/customers'

interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface CustomerListProps {
  customers: Customer[]
  businessId: string
}

export function CustomerList({ customers, businessId }: CustomerListProps) {
  return (
    <div className="space-y-2">
      {customers.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between p-4 border border-border rounded hover:bg-accent/50"
        >
          <div>
            <p className="font-medium text-foreground">{c.name}</p>
            {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
          </div>
          <div className="flex items-center gap-4">
            {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
            <Link href={`/dashboard/businesses/${businessId}/customers/${c.id}`}>
              <button className="text-primary hover:text-primary/80 text-sm font-medium px-2">
                Edit
              </button>
            </Link>
            <DeleteButton
              action={() => deleteCustomer(c.id, businessId)}
              confirmMessage={`Delete ${c.name}? This cannot be undone.`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

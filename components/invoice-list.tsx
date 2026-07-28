'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DeleteButton } from '@/components/delete-button'
import { deleteInvoice } from '@/app/actions/invoices'
import { formatCurrency } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: Date | string
  total: string | number
  status: string
  customerName?: string | null
}

interface InvoiceListProps {
  invoices: Invoice[]
  businessId: string
}

export function InvoiceList({ invoices, businessId }: InvoiceListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Invoice #</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border hover:bg-accent/50 transition">
              <td className="py-4 px-4 text-foreground font-medium">{inv.invoiceNumber}</td>
              <td className="py-4 px-4 text-muted-foreground">
                {new Date(inv.invoiceDate).toLocaleDateString()}
              </td>
              <td className="py-4 px-4 text-foreground font-semibold">
                {formatCurrency(inv.total)}
              </td>
              <td className="py-4 px-4">
                <Badge className={getStatusColor(inv.status)}>
                  {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/businesses/${businessId}/invoices/${inv.id}`}>
                    <button className="text-primary hover:text-primary/80 text-sm font-medium px-2">
                      View
                    </button>
                  </Link>
                  <DeleteButton
                    action={() => deleteInvoice(inv.id, businessId)}
                    confirmMessage={`Delete invoice ${inv.invoiceNumber}? This cannot be undone.`}
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

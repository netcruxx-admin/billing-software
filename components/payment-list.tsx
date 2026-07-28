import Link from 'next/link'
import { formatCurrency, paymentMethodLabel } from '@/lib/utils'

interface Payment {
  id: string
  invoiceId: string
  invoiceNumber?: string
  amount: string | number
  method: string
  createdAt: Date | string
}

interface PaymentListProps {
  payments: Payment[]
  businessId: string
}

export function PaymentList({ payments, businessId }: PaymentListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Invoice</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Method</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-border hover:bg-accent/50 transition">
              <td className="py-4 px-4">
                <Link
                  href={`/dashboard/businesses/${businessId}/invoices/${p.invoiceId}`}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {p.invoiceNumber ?? 'Unknown'}
                </Link>
              </td>
              <td className="py-4 px-4 text-muted-foreground">
                {new Date(p.createdAt).toLocaleDateString()}
              </td>
              <td className="py-4 px-4 text-muted-foreground">
                {paymentMethodLabel(p.method)}
              </td>
              <td className="py-4 px-4 text-green-600 font-semibold">
                +{formatCurrency(p.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

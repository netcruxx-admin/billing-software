'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordPayment } from '@/app/actions/payments'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface PaymentFormProps {
  invoiceId: string
  businessId: string
  amount: number
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
]

export function PaymentForm({ invoiceId, businessId, amount }: PaymentFormProps) {
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      await recordPayment(invoiceId, businessId, amount, method)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      console.error('Payment error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <div className="p-4 bg-accent/50 border border-border rounded-lg">
        <p className="text-sm text-muted-foreground">
          Amount to pay: <span className="font-bold text-foreground">{formatCurrency(amount)}</span>
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
        <Select value={method} onValueChange={(value) => setMethod(value ?? 'cash')}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Recording...' : 'Record Payment'}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Demo mode: this records the payment directly, no card processor is charged.
      </p>
    </div>
  )
}

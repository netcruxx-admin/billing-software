'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PurchasePrintActionsProps {
  purchaseUrl: string
}

export function PurchasePrintActions({ purchaseUrl }: PurchasePrintActionsProps) {
  return (
    <div className="print:hidden sticky top-0 z-10 bg-background border-b border-border">
      <div className="max-w-3xl mx-auto px-10 py-4 flex items-center justify-between">
        <Link href={purchaseUrl} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Purchase
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  )
}

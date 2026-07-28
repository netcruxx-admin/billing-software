import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPurchase, getPurchaseItems } from '@/app/actions/purchases'
import { getBusiness } from '@/app/actions/businesses'
import { getSupplier } from '@/app/actions/suppliers'
import { Button } from '@/components/ui/button'
import { PurchasePrintView } from '@/components/purchase-print-view'

type PurchaseDetailPageProps = {
  params: Promise<{ id: string; purchaseId: string }>
}

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const { id, purchaseId } = await params

  try {
    const [purchase, items, business] = await Promise.all([
      getPurchase(purchaseId, id),
      getPurchaseItems(purchaseId, id),
      getBusiness(id),
    ])

    let supplier = null
    if (purchase.supplierId) {
      try {
        supplier = await getSupplier(purchase.supplierId, id)
      } catch {
        supplier = null
      }
    }

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link href={`/dashboard/businesses/${id}?tab=purchases`} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
                ← Back to Business
              </Link>
              <h1 className="text-4xl font-bold text-foreground">
                Purchase {purchase.purchaseNumber}
              </h1>
            </div>
            <Link href={`/dashboard/businesses/${id}/purchases/${purchaseId}/print`}>
              <Button variant="outline">Print Challan</Button>
            </Link>
          </div>

          <PurchasePrintView business={business} supplier={supplier} purchase={purchase} items={items} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load purchase:', error)
    redirect(`/dashboard/businesses/${id}?tab=purchases`)
  }
}

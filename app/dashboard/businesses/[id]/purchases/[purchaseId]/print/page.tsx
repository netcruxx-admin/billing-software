import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/businesses'
import { getPurchase, getPurchaseItems } from '@/app/actions/purchases'
import { getSupplier } from '@/app/actions/suppliers'
import { PurchasePrintView } from '@/components/purchase-print-view'
import { PurchasePrintActions } from '@/components/purchase-print-actions'

type PurchasePrintPageProps = {
  params: Promise<{ id: string; purchaseId: string }>
}

export default async function PurchasePrintPage({ params }: PurchasePrintPageProps) {
  const { id, purchaseId } = await params

  try {
    const [business, purchase, items] = await Promise.all([
      getBusiness(id),
      getPurchase(purchaseId, id),
      getPurchaseItems(purchaseId, id),
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
      <div className="bg-neutral-100 min-h-svh print:bg-white">
        <PurchasePrintActions purchaseUrl={`/dashboard/businesses/${id}/purchases/${purchaseId}`} />
        <div className="py-10 print:py-0">
          <PurchasePrintView business={business} supplier={supplier} purchase={purchase} items={items} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load purchase for printing:', error)
    redirect(`/dashboard/businesses/${id}/purchases/${purchaseId}`)
  }
}

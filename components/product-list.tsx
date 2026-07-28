'use client'

import Link from 'next/link'
import { DeleteButton } from '@/components/delete-button'
import { deleteProduct } from '@/app/actions/products'
import { formatCurrency, unitLabel } from '@/lib/utils'

interface Variant {
  id: string
  packSize?: string | null
  sku?: string | null
  price: string | number
  quantity: number
}

interface Product {
  id: string
  name: string
  categoryId?: string | null
  unit?: string | null
  gstRate?: number | null
  hsnCode?: string | null
  variants: Variant[]
}

interface ProductListProps {
  products: Product[]
  businessId: string
  categoryNames: Record<string, string>
}

export function ProductList({ products, businessId, categoryNames }: ProductListProps) {
  return (
    <div className="space-y-4">
      {products.map((prod) => (
        <div key={prod.id} className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-accent/30">
            <div>
              <p className="font-semibold text-foreground">{prod.name}</p>
              <p className="text-xs text-muted-foreground">
                {(prod.categoryId && categoryNames[prod.categoryId]) || 'Uncategorized'}
                {prod.gstRate != null && ` · GST ${prod.gstRate}%`}
                {prod.hsnCode && ` · HSN ${prod.hsnCode}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link href={`/dashboard/businesses/${businessId}/inventory/${prod.id}`}>
                <button className="text-primary hover:text-primary/80 text-sm font-medium px-2">
                  Edit
                </button>
              </Link>
              <DeleteButton
                action={() => deleteProduct(prod.id, businessId)}
                confirmMessage={`Delete ${prod.name} and all its pack sizes? This cannot be undone.`}
              />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Pack Size</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {prod.variants.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-2 text-foreground">{v.packSize ? unitLabel(v.packSize) : 'Standard'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{v.sku || '-'}</td>
                  <td className="px-4 py-2 text-foreground font-semibold">{formatCurrency(v.price)}</td>
                  <td className="px-4 py-2 text-foreground">
                    <span className={v.quantity === 0 ? 'text-red-600 font-medium' : ''}>
                      {v.quantity} {unitLabel(prod.unit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

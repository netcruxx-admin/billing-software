'use client'

import Link from 'next/link'
import { DeleteButton } from '@/components/delete-button'
import { deleteProduct } from '@/app/actions/products'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku?: string | null
  price: string
  quantity: number
  category?: string | null
}

interface ProductListProps {
  products: Product[]
  businessId: string
}

export function ProductList({ products, businessId }: ProductListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Product</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">SKU</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Price</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Quantity</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod) => (
            <tr key={prod.id} className="border-b border-border hover:bg-accent/50 transition">
              <td className="py-4 px-4 text-foreground font-medium">{prod.name}</td>
              <td className="py-4 px-4 text-muted-foreground text-sm">{prod.sku || '-'}</td>
              <td className="py-4 px-4 text-foreground font-semibold">{formatCurrency(prod.price)}</td>
              <td className="py-4 px-4 text-foreground">
                <span className={prod.quantity === 0 ? 'text-red-600 font-medium' : ''}>
                  {prod.quantity}
                </span>
              </td>
              <td className="py-4 px-4 text-muted-foreground text-sm">{prod.category || '-'}</td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/businesses/${businessId}/inventory/${prod.id}`}>
                    <button className="text-primary hover:text-primary/80 text-sm font-medium px-2">
                      Edit
                    </button>
                  </Link>
                  <DeleteButton
                    action={() => deleteProduct(prod.id, businessId)}
                    confirmMessage={`Delete ${prod.name}? This cannot be undone.`}
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

'use client'

import { DeleteButton } from '@/components/delete-button'
import { deleteCategory } from '@/app/actions/categories'

interface Category {
  id: string
  name: string
  description?: string | null
}

interface CategoryListProps {
  categories: Category[]
  businessId: string
  productCounts: Record<string, number>
}

export function CategoryList({ categories, businessId, productCounts }: CategoryListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border border-border bg-accent/40 text-sm"
        >
          <span className="font-medium text-foreground">{cat.name}</span>
          <span className="text-muted-foreground">({productCounts[cat.id] ?? 0})</span>
          <DeleteButton
            action={() => deleteCategory(cat.id, businessId)}
            confirmMessage={`Delete category "${cat.name}"? This only works if it has no products.`}
            label="✕"
          />
        </div>
      ))}
    </div>
  )
}

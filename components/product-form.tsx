'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/app/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ExistingProduct {
  id: string
  name: string
  description?: string | null
  sku?: string | null
  price: string | number
  costPrice?: string | number | null
  quantity: number
  category?: string | null
}

interface ProductFormProps {
  businessId: string
  product?: ExistingProduct
  onSuccess?: () => void
}

export function ProductForm({ businessId, product, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const isEditing = Boolean(product)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    sku: product?.sku ?? '',
    price: product?.price != null ? String(product.price) : '',
    costPrice: product?.costPrice != null ? String(product.costPrice) : '',
    quantity: product?.quantity != null ? String(product.quantity) : '',
    category: product?.category ?? '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        category: formData.category,
      }

      if (isEditing && product) {
        await updateProduct(product.id, businessId, payload)
      } else {
        await createProduct(businessId, payload)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/businesses/${businessId}?tab=inventory`)
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
          Product Name *
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Margherita Pizza"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Product description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-foreground mb-2">
            SKU
          </label>
          <Input
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="Product SKU"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
            Category
          </label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., Food"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
            Selling Price (₹) *
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label htmlFor="costPrice" className="block text-sm font-medium text-foreground mb-2">
            Cost Price (₹)
          </label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPrice}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-foreground mb-2">
            Initial Quantity
          </label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading || !formData.name || !formData.price} className="flex-1">
          {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

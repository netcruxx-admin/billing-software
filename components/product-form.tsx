'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/app/actions/products'
import { createCategory } from '@/app/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GST_RATES, UNITS, cn } from '@/lib/utils'

interface ExistingVariant {
  id: string
  packSize?: string | null
  sku?: string | null
  price: string | number
  costPrice?: string | number | null
  mrp?: string | number | null
  quantity: number
  isLoose?: boolean
}

interface ExistingProduct {
  id: string
  name: string
  description?: string | null
  unit?: string | null
  categoryId?: string | null
  gstRate?: number | null
  hsnCode?: string | null
  variants: ExistingVariant[]
}

interface CategoryOption {
  id: string
  name: string
}

interface VariantRow {
  id?: string
  packSize: string
  sku: string
  price: string
  costPrice: string
  mrp: string
  quantity: string
  isLoose: boolean
}

const EMPTY_VARIANT: VariantRow = { packSize: '', sku: '', price: '', costPrice: '', mrp: '', quantity: '', isLoose: false }

interface ProductFormProps {
  businessId: string
  categories: CategoryOption[]
  product?: ExistingProduct
  onSuccess?: () => void
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="pb-6 border-b border-border last:border-0 last:pb-0">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function ProductForm({ businessId, categories, product, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const isEditing = Boolean(product)
  const [loading, setLoading] = useState(false)
  const [localCategories, setLocalCategories] = useState(categories)
  const [addingCategory, setAddingCategory] = useState(categories.length === 0)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    unit: product?.unit ?? 'pcs',
    categoryId: product?.categoryId ?? (categories[0]?.id ?? ''),
    gstRate: product?.gstRate != null ? String(product.gstRate) : '18',
    hsnCode: product?.hsnCode ?? '',
  })
  const [variants, setVariants] = useState<VariantRow[]>(
    product && product.variants.length > 0
      ? product.variants.map((v) => ({
          id: v.id,
          packSize: v.packSize ?? '',
          sku: v.sku ?? '',
          price: v.price != null ? String(v.price) : '',
          costPrice: v.costPrice != null ? String(v.costPrice) : '',
          mrp: v.mrp != null ? String(v.mrp) : '',
          quantity: v.quantity != null ? String(v.quantity) : '',
          isLoose: v.isLoose ?? false,
        }))
      : [{ ...EMPTY_VARIANT }]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleVariantChange = (index: number, field: keyof VariantRow, value: string | boolean) => {
    setVariants(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addVariant = () => setVariants(prev => [...prev, { ...EMPTY_VARIANT }])
  const removeVariant = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index))

  // Not persisted on the product — a client-side convenience that derives
  // each row's (GST-exclusive) Price from its own MRP + the shared GST Rate,
  // for sellers who only know the final shelf price per pack size.
  const [priceType, setPriceType] = useState<'exclusive' | 'inclusive'>('exclusive')
  const gstInclusive = priceType === 'inclusive'
  const effectivePrice = (v: VariantRow): string => {
    if (!gstInclusive) return v.price
    const mrpNum = Number(v.mrp)
    if (!v.mrp || Number.isNaN(mrpNum)) return v.price
    const gstNum = Number(formData.gstRate) || 0
    return (mrpNum / (1 + gstNum / 100)).toFixed(2)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    setCategoryError('')
    try {
      const categoryId = await createCategory(businessId, { name: newCategoryName.trim() })
      const created = { id: categoryId, name: newCategoryName.trim() }
      setLocalCategories(prev => [...prev, created])
      setFormData(prev => ({ ...prev, categoryId }))
      setNewCategoryName('')
      setAddingCategory(false)
    } catch (error) {
      console.error('Failed to add category:', error)
      setCategoryError('Failed to add category')
    }
  }

  const variantsValid = variants.length > 0 && variants.every((v) => effectivePrice(v).trim() !== '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        unit: formData.unit,
        gstRate: Number(formData.gstRate) || 0,
        hsnCode: formData.hsnCode || undefined,
        variants: variants.map((v) => ({
          id: v.id,
          packSize: v.packSize || undefined,
          sku: v.sku || undefined,
          price: Number(effectivePrice(v)),
          costPrice: v.costPrice ? Number(v.costPrice) : undefined,
          mrp: v.mrp ? Number(v.mrp) : undefined,
          quantity: v.quantity ? Number(v.quantity) : 0,
          isLoose: v.isLoose,
        })),
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
      <FormSection title="Category" description="Every product belongs to a category.">
        {!addingCategory ? (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value ?? prev.categoryId }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category">
                    {(value: string) => (value ? localCategories.find(c => c.id === value)?.name : 'Select a category')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {localCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" onClick={() => setAddingCategory(true)}>
              New Category
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Beverages"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCategory()
                  }
                }}
              />
              {categoryError && <p className="text-xs text-destructive mt-1">{categoryError}</p>}
            </div>
            <Button type="button" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Add
            </Button>
            {localCategories.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setAddingCategory(false)}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </FormSection>

      <FormSection title="Product Details">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Product Name *
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Degi Mirch"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-foreground mb-2">
              Base Unit
            </label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value ?? prev.unit }))}
            >
              <SelectTrigger id="unit" className="w-full">
                <SelectValue>
                  {(value: string) => UNITS.find(u => u.value === value)?.label ?? 'Pcs'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="gstRate" className="block text-sm font-medium text-foreground mb-2">
              GST Rate
            </label>
            <Select
              value={formData.gstRate}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gstRate: value ?? prev.gstRate }))}
            >
              <SelectTrigger id="gstRate" className="w-full">
                <SelectValue>{(value: string) => `${value}%`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GST_RATES.map((rate) => (
                  <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Shared by every pack size — pre-filled on invoices.</p>
            <Select
              value={priceType}
              onValueChange={(value) => setPriceType((value as 'exclusive' | 'inclusive') ?? priceType)}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue>
                  {(value: string) => value === 'inclusive' ? 'Inclusive of GST' : 'Exclusive of GST'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Exclusive of GST</SelectItem>
                <SelectItem value="inclusive">Inclusive of GST (MRP is final price)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="hsnCode" className="block text-sm font-medium text-foreground mb-2">
              HSN Code
            </label>
            <Input
              id="hsnCode"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleChange}
              placeholder="08021200"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Pack Sizes"
        description="Add one row per pack size this product is sold in — each carries its own price, cost, MRP and stock. Check Loose only for a bulk item weighed out at the counter (e.g. loose rice) — invoices will ask for grams instead of a pack count."
      >
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-accent/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-2 py-2 w-32">Pack Size</th>
                <th className="px-2 py-2 w-28">SKU</th>
                <th className="px-2 py-2 w-24 text-right">Price (₹) *</th>
                <th className="px-2 py-2 w-24 text-right">Cost (₹)</th>
                <th className="px-2 py-2 w-24 text-right">MRP (₹)</th>
                <th className="px-2 py-2 w-24 text-right">Stock</th>
                <th className="px-2 py-2 w-20 text-center">Loose</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v, index) => (
                <tr key={index} className="border-t border-border align-top">
                  <td className="px-2 py-2">
                    <Input
                      aria-label="Pack Size"
                      className="w-32"
                      value={v.packSize}
                      onChange={(e) => handleVariantChange(index, 'packSize', e.target.value)}
                      placeholder="e.g. 50gm or ₹10"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      aria-label="SKU"
                      className="w-28"
                      value={v.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      placeholder="SKU"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      aria-label="Price"
                      type="text"
                      inputMode="decimal"
                      className={cn('w-24 text-right', gstInclusive && 'bg-muted text-muted-foreground')}
                      value={effectivePrice(v)}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      placeholder="0.00"
                      required
                      disabled={gstInclusive}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      aria-label="Cost Price"
                      type="text"
                      inputMode="decimal"
                      className="w-24 text-right"
                      value={v.costPrice}
                      onChange={(e) => handleVariantChange(index, 'costPrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      aria-label="MRP"
                      type="text"
                      inputMode="decimal"
                      className="w-24 text-right"
                      value={v.mrp}
                      onChange={(e) => handleVariantChange(index, 'mrp', e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      aria-label="Stock Quantity"
                      type="text"
                      inputMode="decimal"
                      className="w-24 text-right"
                      value={v.quantity}
                      onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      aria-label="Sold loose by weight"
                      type="checkbox"
                      className="size-4"
                      checked={v.isLoose}
                      onChange={(e) => handleVariantChange(index, 'isLoose', e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {variants.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)}>
                        ✕
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" onClick={addVariant} className="mt-4">
          Add Pack Size
        </Button>
        {gstInclusive && (
          <p className="text-xs text-muted-foreground mt-2">
            Price is auto-calculated from each row's MRP minus GST — enter MRP to fill it in.
          </p>
        )}
      </FormSection>

      <div className="flex gap-4 pt-2">
        <Button
          type="submit"
          disabled={loading || !formData.name || !formData.categoryId || !variantsValid}
          className="flex-1"
        >
          {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createPurchase } from '@/app/actions/purchases'
import { createSupplier } from '@/app/actions/suppliers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, GST_RATES, unitLabel } from '@/lib/utils'

interface SupplierInfo {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  taxId?: string | null
}

interface ProductVariantInfo {
  id: string
  packSize?: string | null
  price: string | number
  costPrice?: string | number | null
}

interface ProductInfo {
  id: string
  name: string
  unit?: string | null
  gstRate?: number | null
  hsnCode?: string | null
  variants: ProductVariantInfo[]
}

// One purchasable entry per (product, pack size) — cost price and stock are
// tracked per pack size, not per product.
interface PurchasableItem {
  id: string
  productId: string
  variantId: string
  name: string
  costPrice: number
  unit?: string | null
  gstRate?: number | null
  hsnCode?: string | null
}

interface PurchaseFormProps {
  businessId: string
  suppliers?: SupplierInfo[]
  products?: ProductInfo[]
}

interface PurchaseLineItem {
  productId?: string
  variantId?: string
  description: string
  quantity: number | ''
  unit?: string
  unitPrice: number
  taxRate: number
  hsnCode?: string
}

const DEFAULT_ITEM: PurchaseLineItem = { description: '', quantity: '', unitPrice: 0, taxRate: 18 }

const effectiveQuantity = (quantity: number | '') => (quantity === '' ? 0 : Number(quantity))
const lineAmount = (item: PurchaseLineItem) => effectiveQuantity(item.quantity) * Number(item.unitPrice)

export function PurchaseForm({ businessId, suppliers = [], products = [] }: PurchaseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PurchaseLineItem[]>([{ ...DEFAULT_ITEM }])
  const [formData, setFormData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    challanNumber: '',
    notes: '',
  })
  const purchasableItems: PurchasableItem[] = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      variantId: v.id,
      name: p.name + (v.packSize ? ` (${unitLabel(v.packSize)})` : ''),
      costPrice: v.costPrice != null ? Number(v.costPrice) : Number(v.price),
      unit: p.unit,
      gstRate: p.gstRate,
      hsnCode: p.hsnCode,
    }))
  )
  const [supplierMode, setSupplierMode] = useState<'existing' | 'new'>(suppliers.length > 0 ? 'existing' : 'new')
  const [newSupplier, setNewSupplier] = useState({ name: '', taxId: '', phone: '', email: '', address: '' })
  const [suggestIndex, setSuggestIndex] = useState<number | null>(null)
  const [suggestPos, setSuggestPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const descriptionInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const openSuggestions = (index: number) => {
    setSuggestIndex(index)
    const el = descriptionInputRefs.current[index]
    if (el) {
      const rect = el.getBoundingClientRect()
      setSuggestPos({ top: rect.bottom, left: rect.left, width: Math.max(rect.width, 220) })
    }
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleVariantSelect = (index: number, variantId: string) => {
    const variant = purchasableItems.find((v) => v.variantId === variantId)
    if (!variant) return

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      productId: variant.productId,
      variantId: variant.variantId,
      description: variant.name,
      unitPrice: variant.costPrice,
      unit: variant.unit ?? 'pcs',
      taxRate: variant.gstRate != null ? Number(variant.gstRate) : newItems[index].taxRate,
      hsnCode: variant.hsnCode ?? undefined,
      quantity: newItems[index].quantity === '' ? 1 : newItems[index].quantity,
    }
    setItems(newItems)
  }

  const productSuggestions = (query: string) => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return purchasableItems.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 8)
  }

  const addItem = () => {
    setItems([...items, { ...DEFAULT_ITEM }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + lineAmount(item), 0)
  const taxBreakdown = (() => {
    const groups = new Map<number, { taxable: number; tax: number }>()
    for (const item of items) {
      const rate = Number(item.taxRate) || 0
      if (rate <= 0) continue
      const amount = lineAmount(item)
      const bucket = groups.get(rate) ?? { taxable: 0, tax: 0 }
      bucket.taxable += amount
      bucket.tax += amount * (rate / 100)
      groups.set(rate, bucket)
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([rate, v]) => ({ rate, ...v }))
  })()
  const tax = taxBreakdown.reduce((sum, b) => sum + b.tax, 0)
  const total = subtotal + tax

  const selectedSupplier = suppliers.find((s) => s.id === formData.supplierId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let supplierId = formData.supplierId || undefined

      if (supplierMode === 'new' && newSupplier.name.trim()) {
        supplierId = await createSupplier(businessId, {
          name: newSupplier.name,
          taxId: newSupplier.taxId || undefined,
          phone: newSupplier.phone || undefined,
          email: newSupplier.email || undefined,
          address: newSupplier.address || undefined,
        })
      }

      const purchaseData = {
        supplierId,
        purchaseDate: new Date(formData.purchaseDate),
        challanNumber: formData.challanNumber.trim() || undefined,
        notes: formData.notes,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || 'pcs',
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate) || 0,
          hsnCode: item.hsnCode || undefined,
        })),
      }

      await createPurchase(businessId, purchaseData)
      router.push(`/dashboard/businesses/${businessId}?tab=purchases`)
    } catch (error) {
      console.error('Failed to create purchase:', error)
      alert('Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Purchase Date *</label>
          <Input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Supplier Challan / Bill No.</label>
          <Input
            value={formData.challanNumber}
            onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
            placeholder="e.g., Supplier's own DC/invoice number"
          />
        </div>
      </div>

      {/* Supplier */}
      <div className="border border-border rounded-lg p-4 space-y-3 max-w-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Purchased From
          </h3>
          {suppliers.length > 0 && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSupplierMode('existing')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  supplierMode === 'existing' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => setSupplierMode('new')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  supplierMode === 'new' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                New
              </button>
            </div>
          )}
        </div>

        {supplierMode === 'existing' && suppliers.length > 0 ? (
          <>
            <Select
              value={formData.supplierId}
              onValueChange={(value) => setFormData({ ...formData, supplierId: value ?? '' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a supplier (optional)">
                  {(value: string) => (value ? suppliers.find(s => s.id === value)?.name : 'Select a supplier (optional)')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSupplier && (
              <div className="space-y-1 text-sm pt-2 border-t border-border">
                {selectedSupplier.taxId && <p className="text-muted-foreground">GSTIN: {selectedSupplier.taxId}</p>}
                {selectedSupplier.address && <p className="text-muted-foreground">{selectedSupplier.address}</p>}
                {selectedSupplier.phone && <p className="text-muted-foreground">{selectedSupplier.phone}</p>}
                {selectedSupplier.email && <p className="text-muted-foreground">{selectedSupplier.email}</p>}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Supplier name"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="GSTIN"
                value={newSupplier.taxId}
                onChange={(e) => setNewSupplier({ ...newSupplier, taxId: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
              />
            </div>
            <Input
              placeholder="Address"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave the name blank if there's no supplier on file for this purchase. Otherwise this supplier is saved for future purchases.
            </p>
          </div>
        )}
      </div>

      {/* Purchase Items */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Purchase Items</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-accent/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-2 py-2 w-10">#</th>
                <th className="px-2 py-2 w-64">Item</th>
                <th className="px-2 py-2 w-20">HSN Code</th>
                <th className="px-2 py-2 w-24 text-right">Qty</th>
                <th className="px-2 py-2 w-24 text-right">Cost / Unit</th>
                <th className="px-2 py-2 w-20 text-right">Tax%</th>
                <th className="px-2 py-2 w-24 text-right">Amount</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const amount = lineAmount(item)
                return (
                  <tr key={index} className="border-t border-border align-top">
                    <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-2 relative">
                      <Input
                        ref={(el) => { descriptionInputRefs.current[index] = el }}
                        aria-label="Description"
                        placeholder="Type to search products..."
                        value={item.description}
                        onChange={(e) => {
                          handleItemChange(index, 'description', e.target.value)
                          openSuggestions(index)
                        }}
                        onFocus={() => openSuggestions(index)}
                        onBlur={() => setTimeout(() => setSuggestIndex((cur) => (cur === index ? null : cur)), 150)}
                        required
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label="HSN Code"
                        placeholder="HSN"
                        className="w-20"
                        value={item.hsnCode ?? ''}
                        onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label="Quantity"
                        type="text"
                        inputMode="decimal"
                        className="w-24 text-right"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : e.target.value)}
                        required
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label="Cost per unit"
                        type="text"
                        inputMode="decimal"
                        className="w-24 text-right"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        value={String(item.taxRate)}
                        onValueChange={(value) => handleItemChange(index, 'taxRate', Number(value ?? 0))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue>{(value: string) => `${value}%`}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {GST_RATES.map((rate) => (
                            <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-foreground whitespace-nowrap">{formatCurrency(amount)}</td>
                    <td className="px-2 py-2">
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          ✕
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {suggestIndex !== null && suggestPos && typeof document !== 'undefined' && (() => {
          const matches = productSuggestions(items[suggestIndex]?.description ?? '')
          if (matches.length === 0) return null
          return createPortal(
            <div
              style={{ position: 'fixed', top: suggestPos.top, left: suggestPos.left, width: suggestPos.width }}
              className="z-50 rounded-lg border border-border bg-popover shadow-md max-h-48 overflow-y-auto"
            >
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleVariantSelect(suggestIndex, p.variantId)
                    setSuggestIndex(null)
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  {p.name}
                </button>
              ))}
            </div>,
            document.body
          )
        })()}
        <Button type="button" variant="outline" onClick={addItem} className="mt-4">
          Add Item
        </Button>
      </div>

      {/* Totals */}
      <div className="bg-accent/30 p-6 rounded-lg space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        {taxBreakdown.map((b) => (
          <div key={b.rate} className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST {b.rate}%:</span>
            <span className="font-medium">{formatCurrency(b.tax)}</span>
          </div>
        ))}
        <div className="border-t border-border pt-3 flex justify-between text-lg">
          <span className="font-semibold text-foreground">Total:</span>
          <span className="font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">Notes</label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes for this purchase..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Recording...' : 'Record Purchase'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createInvoice } from '@/app/actions/invoices'
import { createCustomer } from '@/app/actions/customers'
import type { InvoiceColumn } from '@/app/actions/invoice-columns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, GST_RATES, SOLD_BY_OPTIONS, PAYMENT_MODES, TIME_UNITS, cn, invoiceLayout, invoiceReferenceLabel, pricePerGram, unitLabel } from '@/lib/utils'

interface BusinessInfo {
  name: string
  type?: string
  taxId?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

interface CustomerInfo {
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
  sku?: string | null
  price: string | number
  quantity: number
  mrp?: string | number | null
  isLoose: boolean
}

interface ProductInfo {
  id: string
  name: string
  unit?: string | null
  gstRate?: number | null
  hsnCode?: string | null
  variants: ProductVariantInfo[]
}

// A sellable line — one per (product, pack size) combination, since price
// and stock are tracked per pack size, not per product.
interface SellableItem {
  id: string // the variant id; used as the suggestion list's react key
  productId: string
  variantId: string
  name: string
  price: number
  quantity: number
  unit?: string | null
  gstRate?: number | null
  hsnCode?: string | null
  mrp?: number | null
  packSize?: string | null
  isLoose: boolean
}

interface InvoiceFormProps {
  businessId: string
  business?: BusinessInfo
  customers?: CustomerInfo[]
  products?: ProductInfo[]
  invoiceColumns?: InvoiceColumn[]
}

interface InvoiceLineItem {
  productId?: string
  variantId?: string
  description: string
  quantity: number | ''
  unit?: string
  unitPrice: number
  taxRate: number
  hsnCode?: string
  mrp?: number | ''
  packSize?: string
  // Whether this line's quantity is an exact weight in grams (a bulk item
  // weighed out at the counter) rather than a plain pack/piece count.
  // Independent of packSize, which is just the pack's descriptive label.
  isLoose?: boolean
  cdRate?: number
  giftNote?: string
  // Values for this business's custom invoice columns, keyed by
  // InvoiceColumn.key.
  customFields?: Record<string, string>
}

const DEFAULT_ITEM: InvoiceLineItem = {
  description: '',
  quantity: '',
  unitPrice: 0,
  taxRate: 18,
  cdRate: 0,
  isLoose: false,
  customFields: {},
}

type ColumnKey = 'index' | 'item' | 'hsn' | 'soldBy' | 'mrp' | 'qty' | 'rate' | 'cd' | 'gift' | 'tax' | 'amount' | 'actions'

// Ghost/inline style for inputs & selects embedded in the item table —
// a full bordered pill per cell reads as cluttered in a dense grid, so
// these stay blended into the row and only reveal a border on
// hover/focus, matching the spreadsheet-cell convention (Sheets/Airtable).
const CELL_FIELD_CLASS =
  'rounded-md border-transparent bg-transparent px-2 shadow-none hover:border-border focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/30'

const DEFAULT_COL_WIDTHS: Record<ColumnKey, number> = {
  index: 40,
  item: 280,
  hsn: 100,
  soldBy: 110,
  mrp: 100,
  qty: 100,
  rate: 110,
  cd: 70,
  gift: 160,
  tax: 100,
  amount: 120,
  actions: 60,
}

const MIN_COL_WIDTHS: Record<ColumnKey, number> = {
  index: 36,
  item: 160,
  hsn: 70,
  soldBy: 90,
  mrp: 70,
  qty: 70,
  rate: 80,
  cd: 56,
  gift: 100,
  tax: 80,
  amount: 90,
  actions: 48,
}

// Custom columns (business-defined, see Invoice Columns settings) aren't in
// the maps above since their keys are dynamic — they fall back to these.
const DEFAULT_CUSTOM_COL_WIDTH = 130
const MIN_CUSTOM_COL_WIDTH = 90

// A thin drag handle on a header cell's right edge — the invoice-item
// table uses table-layout: fixed (via <colgroup>) so columns hold a
// precise width instead of the browser guessing from content, and this
// is how the user adjusts that width per column.
function ColumnResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/50 active:bg-primary"
    />
  )
}

// A blank quantity means a flat-fee line item (e.g. a service charge) —
// treat it as a single unit for the on-screen total preview, matching the
// backend's amount calculation.
const effectiveQuantity = (quantity: number | '') => (quantity === '' ? 1 : Number(quantity))
// The gift note is purely informational (e.g. "free sample from company")
// and has no effect on pricing — the line is still billed normally.
const lineGross = (item: InvoiceLineItem) => effectiveQuantity(item.quantity) * Number(item.unitPrice)
const lineAmount = (item: InvoiceLineItem) => {
  const gross = lineGross(item)
  const discountRate = Number(item.cdRate) || 0
  return gross - gross * (discountRate / 100)
}

export function InvoiceForm({ businessId, business, customers = [], products = [], invoiceColumns = [] }: InvoiceFormProps) {
  const router = useRouter()
  const isOffice = business?.type === 'office' || business?.name === 'Net-Crux'
  const buildItem = (): InvoiceLineItem => ({ ...DEFAULT_ITEM, unit: isOffice ? 'month' : undefined, customFields: {} })
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<InvoiceLineItem[]>([buildItem()])
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    deliveryDate: '',
    paymentMode: 'cash',
    notes: '',
    referenceNote: '',
  })
  const referenceLabel = invoiceReferenceLabel(business?.type)
  const layout = invoiceLayout(business?.type)
  // Custom (business-defined) columns always render after the fixed ones,
  // right before the row-delete action column.
  const visibleColumns: string[] = [
    'index',
    'item',
    ...(layout === 'retail' ? ['hsn', 'soldBy', 'mrp'] : []),
    'qty',
    'rate',
    ...(layout === 'retail' ? ['cd', 'gift'] : []),
    'tax',
    'amount',
    ...invoiceColumns.map((c) => c.key),
    'actions',
  ]
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS)
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  const colWidth = (key: string) => colWidths[key] ?? DEFAULT_CUSTOM_COL_WIDTH
  const colMinWidth = (key: string) => (MIN_COL_WIDTHS as Record<string, number>)[key] ?? MIN_CUSTOM_COL_WIDTH

  const handleResizeMove = (e: MouseEvent) => {
    const r = resizingRef.current
    if (!r) return
    const next = Math.max(colMinWidth(r.key), r.startWidth + (e.clientX - r.startX))
    setColWidths((prev) => ({ ...prev, [r.key]: next }))
  }

  const handleResizeEnd = () => {
    resizingRef.current = null
    window.removeEventListener('mousemove', handleResizeMove)
    window.removeEventListener('mouseup', handleResizeEnd)
  }

  const startResize = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = { key, startX: e.clientX, startWidth: colWidth(key) }
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
  }

  const handleCustomFieldChange = (index: number, key: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], customFields: { ...newItems[index].customFields, [key]: value } }
    setItems(newItems)
  }
  // One sellable entry per (product, pack size) — price and stock are
  // tracked per pack size, so billing has to pick a specific variant, not
  // just the parent product.
  const sellableItems: SellableItem[] = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      variantId: v.id,
      name: p.name + (v.packSize ? ` (${unitLabel(v.packSize)})` : ''),
      price: Number(v.price),
      quantity: v.quantity,
      unit: p.unit,
      gstRate: p.gstRate,
      hsnCode: p.hsnCode,
      mrp: v.mrp != null ? Number(v.mrp) : null,
      packSize: v.packSize,
      isLoose: v.isLoose,
    }))
  )
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(customers.length > 0 ? 'existing' : 'new')
  const [newCustomer, setNewCustomer] = useState({ name: '', taxId: '', phone: '', email: '', address: '' })
  // Which item row's product-name suggestion list is open, if any, and where
  // to position it. Portaled to <body> (see render below) because the items
  // table scrolls horizontally (`overflow-x-auto`), which per the CSS spec
  // forces vertical overflow to clip too — an absolutely-positioned dropdown
  // nested inside that container would get silently cut off.
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
    const variant = sellableItems.find((v) => v.variantId === variantId)
    if (!variant) return

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      productId: variant.productId,
      variantId: variant.variantId,
      description: variant.name,
      unitPrice: variant.price,
      isLoose: variant.isLoose,
      unit: isOffice
        ? newItems[index].unit ?? 'month'
        : variant.isLoose
          ? 'g'
          : variant.unit ?? 'pcs',
      taxRate: variant.gstRate != null ? Number(variant.gstRate) : newItems[index].taxRate,
      hsnCode: variant.hsnCode ?? undefined,
      mrp: variant.mrp != null ? Number(variant.mrp) : '',
      packSize: variant.packSize ?? undefined,
      // Inventory items need a real quantity for stock deduction — default
      // to 1 if the field was left blank when the product was picked.
      quantity: newItems[index].quantity === '' ? 1 : newItems[index].quantity,
    }
    setItems(newItems)
  }

  // Manually overrides how this line's quantity is entered — lets a cashier
  // mark an ad-hoc line (not linked to any product) as loose, e.g. loose
  // vegetables that aren't in the catalog. Also sets a sensible default
  // unit right away, otherwise an untouched line would fall back to 'pcs'
  // at submit time (see handleSubmit below), misrepresenting what was sold.
  const handleSoldByChange = (index: number, soldBy: string) => {
    const isLoose = soldBy === 'loose'
    const newItems = [...items]
    const linkedVariant = findSellable(newItems[index].variantId)
    newItems[index] = {
      ...newItems[index],
      isLoose,
      unit: isLoose ? 'g' : (linkedVariant?.unit ?? newItems[index].unit ?? 'pcs'),
    }
    setItems(newItems)
  }

  // A loose (weighed) line's invoice quantity is the exact grams the
  // cashier types, not a fixed pack count — so the Rate has to become a
  // per-gram price for quantity * rate to still equal the correct total.
  // Only applies to product-linked items, since an unlinked line has no
  // per-kg base price to convert from.
  const handleLooseGramsChange = (index: number, gramsInput: string) => {
    const newItems = [...items]
    const item = newItems[index]
    const linkedVariant = findSellable(item.variantId)
    newItems[index] = {
      ...item,
      quantity: (gramsInput === '' ? '' : gramsInput) as number | '',
      unit: 'g',
      unitPrice: linkedVariant ? pricePerGram(linkedVariant.price) : item.unitPrice,
    }
    setItems(newItems)
  }

  // Sellable items whose name matches what's been typed into a row's
  // Description field so far — powers the type-ahead suggestion list that
  // replaces the old separate "pick from inventory" dropdown.
  const productSuggestions = (query: string) => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return sellableItems.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 8)
  }

  const addItem = () => {
    setItems([...items, buildItem()])
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

  const findSellable = (variantId?: string) => sellableItems.find((v) => v.variantId === variantId)
  const selectedCustomer = customers.find((c) => c.id === formData.customerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let customerId = formData.customerId || undefined

      if (customerMode === 'new' && newCustomer.name.trim()) {
        customerId = await createCustomer(businessId, {
          name: newCustomer.name,
          taxId: newCustomer.taxId || undefined,
          phone: newCustomer.phone || undefined,
          email: newCustomer.email || undefined,
          address: newCustomer.address || undefined,
        })
      }

      const invoiceData = {
        customerId,
        invoiceDate: new Date(formData.invoiceDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        deliveryDate: layout === 'retail' && formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        paymentMode: layout === 'retail' ? formData.paymentMode : undefined,
        notes: formData.notes,
        referenceNote: formData.referenceNote.trim() || undefined,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          description: item.description,
          quantity: item.quantity === '' ? undefined : Number(item.quantity),
          unit: item.unit || 'pcs',
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate) || 0,
          hsnCode: item.hsnCode || undefined,
          mrp: item.mrp !== '' && item.mrp != null ? Number(item.mrp) : undefined,
          packSize: item.packSize || undefined,
          cdRate: layout === 'retail' ? Number(item.cdRate) || 0 : undefined,
          giftNote: layout === 'retail' ? (item.giftNote?.trim() || undefined) : undefined,
          customFields: item.customFields && Object.keys(item.customFields).length > 0 ? item.customFields : undefined,
        })),
      }

      await createInvoice(businessId, invoiceData)
      router.push(`/dashboard/businesses/${businessId}?tab=invoices`)
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Invoice Date *</label>
          <Input
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
        {referenceLabel && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{referenceLabel}</label>
            <Input
              value={formData.referenceNote}
              onChange={(e) => setFormData({ ...formData, referenceNote: e.target.value })}
              placeholder={referenceLabel}
            />
          </div>
        )}
        {layout === 'retail' && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Delivery Date</label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Mode</label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMode: value ?? prev.paymentMode }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => PAYMENT_MODES.find(m => m.value === value)?.label ?? 'Cash'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Billed By / Bill To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billed By (Company) */}
        <div className="border border-border rounded-lg p-4 bg-accent/20">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Billed By
          </h3>
          {business ? (
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">{business.name}</p>
              {business.taxId && <p className="text-muted-foreground">GSTIN: {business.taxId}</p>}
              {business.address && <p className="text-muted-foreground">{business.address}</p>}
              {business.phone && <p className="text-muted-foreground">{business.phone}</p>}
              {business.email && <p className="text-muted-foreground">{business.email}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No business details on file.</p>
          )}
          <Link
            href={`/dashboard/businesses/${businessId}/edit`}
            className="text-xs text-primary hover:underline mt-3 inline-block"
          >
            Edit business details →
          </Link>
        </div>

        {/* Bill To (Customer) */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Bill To
            </h3>
            {customers.length > 0 && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium transition',
                    customerMode === 'existing'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium transition',
                    customerMode === 'new'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  New
                </button>
              </div>
            )}
          </div>

          {customerMode === 'existing' && customers.length > 0 ? (
            <>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value ?? '' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a customer (optional)">
                    {(value: string) => (value ? customers.find(c => c.id === value)?.name : 'Select a customer (optional)')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className="space-y-1 text-sm pt-2 border-t border-border">
                  {selectedCustomer.taxId && <p className="text-muted-foreground">GSTIN: {selectedCustomer.taxId}</p>}
                  {selectedCustomer.address && <p className="text-muted-foreground">{selectedCustomer.address}</p>}
                  {selectedCustomer.phone && <p className="text-muted-foreground">{selectedCustomer.phone}</p>}
                  {selectedCustomer.email && <p className="text-muted-foreground">{selectedCustomer.email}</p>}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="GSTIN"
                  value={newCustomer.taxId}
                  onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <Input
                placeholder="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
              <Input
                placeholder="Email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave the name blank for a walk-in sale with no customer on file. Otherwise this customer is saved for future invoices.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Items */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Invoice Items</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {visibleColumns.map((key) => (
                <col key={key} style={{ width: colWidth(key) }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-accent/50 text-left text-xs font-medium text-muted-foreground">
                <th className="relative px-2 py-2 border border-border">
                  <span className="block truncate">#</span>
                  <ColumnResizeHandle onMouseDown={startResize('index')} />
                </th>
                <th className="relative px-2 py-2 border border-border">
                  <span className="block truncate">Item</span>
                  <ColumnResizeHandle onMouseDown={startResize('item')} />
                </th>
                {layout === 'retail' && (
                  <th className="relative px-2 py-2 border border-border">
                    <span className="block truncate">HSN Code</span>
                    <ColumnResizeHandle onMouseDown={startResize('hsn')} />
                  </th>
                )}
                {layout === 'retail' && (
                  <th className="relative px-2 py-2 border border-border">
                    <span className="block truncate">Sold By</span>
                    <ColumnResizeHandle onMouseDown={startResize('soldBy')} />
                  </th>
                )}
                {layout === 'retail' && (
                  <th className="relative px-2 py-2 text-right border border-border">
                    <span className="block truncate">MRP</span>
                    <ColumnResizeHandle onMouseDown={startResize('mrp')} />
                  </th>
                )}
                <th className="relative px-2 py-2 text-right border border-border">
                  <span className="block truncate">{isOffice ? 'Duration' : layout === 'retail' ? 'Unit' : 'Qty'}</span>
                  <ColumnResizeHandle onMouseDown={startResize('qty')} />
                </th>
                <th className="relative px-2 py-2 text-right border border-border">
                  <span className="block truncate">Rate</span>
                  <ColumnResizeHandle onMouseDown={startResize('rate')} />
                </th>
                {layout === 'retail' && (
                  <th className="relative px-2 py-2 text-right border border-border">
                    <span className="block truncate">CD%</span>
                    <ColumnResizeHandle onMouseDown={startResize('cd')} />
                  </th>
                )}
                {layout === 'retail' && (
                  <th className="relative px-2 py-2 border border-border">
                    <span className="block truncate">Gift</span>
                    <ColumnResizeHandle onMouseDown={startResize('gift')} />
                  </th>
                )}
                <th className="relative px-2 py-2 text-right border border-border">
                  <span className="block truncate">Tax%</span>
                  <ColumnResizeHandle onMouseDown={startResize('tax')} />
                </th>
                <th className="relative px-2 py-2 text-right border border-border">
                  <span className="block truncate">{layout === 'retail' ? 'Gross Amt' : 'Amount'}</span>
                  <ColumnResizeHandle onMouseDown={startResize('amount')} />
                </th>
                {invoiceColumns.map((col) => (
                  <th key={col.key} className="relative px-2 py-2 border border-border">
                    <span className="block truncate">{col.label}</span>
                    <ColumnResizeHandle onMouseDown={startResize(col.key)} />
                  </th>
                ))}
                <th className="px-2 py-2 border border-border" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const linkedVariant = findSellable(item.variantId)
                const overStock = linkedVariant != null && effectiveQuantity(item.quantity) > linkedVariant.quantity
                const gross = lineGross(item)
                const amount = lineAmount(item)

                return (
                  <tr key={index} className="align-top hover:bg-accent/30">
                    <td className="px-2 py-2 border border-border text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-2 border border-border relative">
                      <Input
                        ref={(el) => { descriptionInputRefs.current[index] = el }}
                        aria-label="Description"
                        placeholder="Type to search products..."
                        className={CELL_FIELD_CLASS}
                        value={item.description}
                        onChange={(e) => {
                          handleItemChange(index, 'description', e.target.value)
                          openSuggestions(index)
                        }}
                        onFocus={() => openSuggestions(index)}
                        onBlur={() => setTimeout(() => setSuggestIndex((cur) => (cur === index ? null : cur)), 150)}
                        required
                      />
                      {overStock && (
                        <p className="text-xs text-orange-600 mt-1">
                          Only {linkedVariant!.quantity} in stock
                        </p>
                      )}
                    </td>
                    {layout === 'retail' && (
                      <td className="px-2 py-2 border border-border">
                        <Input
                          aria-label="HSN Code"
                          placeholder="HSN"
                          className={CELL_FIELD_CLASS}
                          value={item.hsnCode ?? ''}
                          onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                        />
                      </td>
                    )}
                    {layout === 'retail' && (
                      <td className="px-2 py-2 border border-border">
                        <Select
                          value={item.isLoose ? 'loose' : 'unit'}
                          onValueChange={(value) => handleSoldByChange(index, value ?? 'unit')}
                        >
                          <SelectTrigger aria-label="Sold By" className={cn(CELL_FIELD_CLASS, 'w-full')}>
                            <SelectValue>
                              {(value: string) => SOLD_BY_OPTIONS.find(p => p.value === value)?.label ?? 'Piece'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="min-w-fit">
                            {SOLD_BY_OPTIONS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    )}
                    {layout === 'retail' && (
                      <td className="px-2 py-2 border border-border">
                        <Input
                          aria-label="MRP"
                          type="text"
                          inputMode="decimal"
                          className={cn(CELL_FIELD_CLASS, 'text-right')}
                          value={item.mrp ?? ''}
                          onChange={(e) => handleItemChange(index, 'mrp', e.target.value === '' ? '' : e.target.value)}
                        />
                      </td>
                    )}
                    <td className="px-2 py-2 border border-border">
                      {layout === 'retail' ? (
                        !item.isLoose ? (
                          <Input
                            aria-label="Quantity"
                            type="text"
                            inputMode="numeric"
                            className={cn(CELL_FIELD_CLASS, 'text-right')}
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : e.target.value)}
                          />
                        ) : (
                          <Input
                            aria-label="Grams"
                            type="text"
                            inputMode="decimal"
                            className={cn(CELL_FIELD_CLASS, 'text-right')}
                            placeholder="Grams"
                            value={item.quantity}
                            onChange={(e) => handleLooseGramsChange(index, e.target.value)}
                          />
                        )
                      ) : (
                        <>
                          <Input
                            aria-label={isOffice ? 'Duration' : 'Quantity'}
                            type="text"
                            inputMode="decimal"
                            className={cn(CELL_FIELD_CLASS, 'text-right')}
                            placeholder={isOffice ? '1' : item.productId ? '' : 'Flat fee'}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : e.target.value)}
                            required={!!item.productId}
                          />
                          {isOffice && (
                            <Select
                              value={item.unit ?? 'month'}
                              onValueChange={(value) => handleItemChange(index, 'unit', value ?? 'month')}
                            >
                              <SelectTrigger className={cn(CELL_FIELD_CLASS, 'w-full mt-1 h-7 text-xs')}>
                                <SelectValue>{(value: string) => TIME_UNITS.find(u => u.value === value)?.label ?? 'Month'}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_UNITS.map((u) => (
                                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-2 py-2 border border-border">
                      <Input
                        aria-label="Rate"
                        type="text"
                        inputMode="decimal"
                        className={cn(CELL_FIELD_CLASS, 'text-right')}
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                      />
                    </td>
                    {layout === 'retail' && (
                      <td className="px-2 py-2 border border-border">
                        <Input
                          aria-label="CD%"
                          type="text"
                          inputMode="decimal"
                          className={cn(CELL_FIELD_CLASS, 'text-right')}
                          value={item.cdRate ?? 0}
                          onChange={(e) => handleItemChange(index, 'cdRate', e.target.value)}
                        />
                      </td>
                    )}
                    {layout === 'retail' && (
                      <td className="px-2 py-2 border border-border">
                        <Input
                          aria-label="Gift"
                          placeholder="e.g. Free gift box"
                          className={CELL_FIELD_CLASS}
                          value={item.giftNote ?? ''}
                          onChange={(e) => handleItemChange(index, 'giftNote', e.target.value)}
                        />
                      </td>
                    )}
                    <td className="px-2 py-2 border border-border">
                      <Select
                        value={String(item.taxRate)}
                        onValueChange={(value) => handleItemChange(index, 'taxRate', Number(value ?? 0))}
                      >
                        <SelectTrigger className={cn(CELL_FIELD_CLASS, 'w-full')}>
                          <SelectValue>{(value: string) => `${value}%`}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {GST_RATES.map((rate) => (
                            <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {layout === 'retail' ? (
                      <td className="px-2 py-2 border border-border text-right font-medium text-foreground whitespace-nowrap">{formatCurrency(gross)}</td>
                    ) : (
                      <td className="px-2 py-2 border border-border text-right font-medium text-foreground whitespace-nowrap">{formatCurrency(amount)}</td>
                    )}
                    {invoiceColumns.map((col) => (
                      <td key={col.key} className="px-2 py-2 border border-border">
                        <Input
                          aria-label={col.label}
                          type="text"
                          inputMode={col.fieldType === 'number' ? 'decimal' : undefined}
                          className={cn(CELL_FIELD_CLASS, col.fieldType === 'number' ? 'text-right' : undefined)}
                          value={item.customFields?.[col.key] ?? ''}
                          onChange={(e) => handleCustomFieldChange(index, col.key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2 border border-border">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
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
                  {p.name}{' '}
                  <span className="text-xs text-muted-foreground">
                    ({p.quantity} {unitLabel(p.unit)} in stock)
                  </span>
                </button>
              ))}
            </div>,
            document.body
          )
        })()}
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="mt-4"
        >
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
          placeholder="Add any additional notes for the invoice..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Invoice'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

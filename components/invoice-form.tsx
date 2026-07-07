'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createInvoice } from '@/app/actions/invoices'
import { createCustomer } from '@/app/actions/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, GST_RATES, cn } from '@/lib/utils'

interface BusinessInfo {
  name: string
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

interface InvoiceFormProps {
  businessId: string
  business?: BusinessInfo
  customers?: CustomerInfo[]
  products?: Array<{ id: string; name: string; price: string | number; quantity: number }>
}

interface InvoiceLineItem {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
}

const NO_PRODUCT = '__none__'

export function InvoiceForm({ businessId, business, customers = [], products = [] }: InvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { description: '', quantity: 1, unitPrice: 0 }
  ])
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    taxRate: 18,
  })
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(customers.length > 0 ? 'existing' : 'new')
  const [newCustomer, setNewCustomer] = useState({ name: '', taxId: '', phone: '', email: '', address: '' })

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleProductSelect = (index: number, productId: string) => {
    if (productId === NO_PRODUCT) {
      const newItems = [...items]
      newItems[index] = { ...newItems[index], productId: undefined }
      setItems(newItems)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (!product) return

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      description: product.name,
      unitPrice: Number(product.price),
    }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)
  const taxRate = Number(formData.taxRate) || 0
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const findProduct = (productId?: string) => products.find((p) => p.id === productId)
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
        notes: formData.notes,
        taxRate: Number(formData.taxRate) || 0,
        items: items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
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
                  <SelectValue placeholder="Select a customer (optional)" />
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
        <div className="space-y-4">
          {items.map((item, index) => {
            const linkedProduct = findProduct(item.productId)
            const overStock = linkedProduct != null && Number(item.quantity) > linkedProduct.quantity

            return (
              <div key={index} className="bg-accent/50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-12 gap-4 items-end">
                  {products.length > 0 && (
                    <div className="col-span-12 md:col-span-3">
                      <Select
                        value={item.productId ?? NO_PRODUCT}
                        onValueChange={(value) => handleProductSelect(index, value ?? NO_PRODUCT)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="From inventory" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_PRODUCT}>Custom item</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.quantity} in stock)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className={products.length > 0 ? 'col-span-12 md:col-span-4' : 'col-span-5'}
                    required
                  />
                  <Input
                    placeholder="Qty"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className={products.length > 0 ? 'col-span-4 md:col-span-2' : 'col-span-2'}
                    required
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className={products.length > 0 ? 'col-span-4 md:col-span-2' : 'col-span-2'}
                    required
                  />
                  <div className={`text-right ${products.length > 0 ? 'col-span-3 md:col-span-1' : 'col-span-2'}`}>
                    {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="col-span-1"
                    >
                      ✕
                    </Button>
                  )}
                </div>
                {overStock && (
                  <p className="text-xs text-orange-600">
                    Only {linkedProduct!.quantity} in stock — this will bring inventory negative-safe (clamped to 0).
                  </p>
                )}
              </div>
            )
          })}
        </div>
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
        <div className="flex justify-between items-center">
          <label htmlFor="taxRate" className="text-sm text-muted-foreground">GST:</label>
          <div className="w-32">
            <Select
              value={String(formData.taxRate)}
              onValueChange={(value) => setFormData({ ...formData, taxRate: Number(value ?? 0) })}
            >
              <SelectTrigger id="taxRate" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GST_RATES.map((rate) => (
                  <SelectItem key={rate} value={String(rate)}>
                    {rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">GST Amount:</span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupplier } from '@/app/actions/suppliers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SupplierFormProps {
  businessId: string
}

export function SupplierForm({ businessId }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createSupplier(businessId, formData)
      router.push(`/dashboard/businesses/${businessId}?tab=purchases`)
    } catch (error) {
      console.error('Failed to create supplier:', error)
      alert('Failed to create supplier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
          Supplier Name *
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Acme Wholesale"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="supplier@example.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
            Phone
          </label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
          Address
        </label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="123 Main St, City, State 12345"
        />
      </div>

      <div>
        <label htmlFor="taxId" className="block text-sm font-medium text-foreground mb-2">
          Tax ID / GSTIN
        </label>
        <Input
          id="taxId"
          name="taxId"
          value={formData.taxId}
          onChange={handleChange}
          placeholder="Tax ID"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading || !formData.name} className="flex-1">
          {loading ? 'Creating...' : 'Create Supplier'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

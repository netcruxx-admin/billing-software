'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBusiness, updateBusiness } from '@/app/actions/businesses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant/Bar' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'store', label: 'General Store/Retail' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'other', label: 'Other' },
]

interface ExistingBusiness {
  id: string
  name: string
  type: string
  address?: string | null
  phone?: string | null
  email?: string | null
  taxId?: string | null
}

interface BusinessFormProps {
  business?: ExistingBusiness
}

export function BusinessForm({ business }: BusinessFormProps) {
  const router = useRouter()
  const isEditing = Boolean(business)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: business?.name ?? '',
    type: business?.type ?? 'restaurant',
    address: business?.address ?? '',
    phone: business?.phone ?? '',
    email: business?.email ?? '',
    taxId: business?.taxId ?? '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditing && business) {
        await updateBusiness(business.id, formData)
        router.push(`/dashboard/businesses/${business.id}`)
      } else {
        const businessId = await createBusiness(formData)
        router.push(`/dashboard/businesses/${businessId}`)
      }
    } catch (error) {
      console.error('Failed to save business:', error)
      alert('Failed to save business')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
          Business Name *
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., The Pizza Place"
          required
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
          Business Type *
        </label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value ?? prev.type }))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          placeholder="business@example.com"
          className="w-full"
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
          placeholder="+91 98765 43210"
          className="w-full"
        />
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
          placeholder="123 MG Road, Bengaluru, Karnataka 560001"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="taxId" className="block text-sm font-medium text-foreground mb-2">
          GSTIN (GST Number)
        </label>
        <Input
          id="taxId"
          name="taxId"
          value={formData.taxId}
          onChange={handleChange}
          placeholder="22AAAAA0000A1Z5"
          className="w-full"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={loading || !formData.name}
          className="flex-1"
        >
          {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Business'}
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

'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface Business {
  id: string
  userId: string
  name: string
  type: string
  address?: string | null
  phone?: string | null
  email?: string | null
  taxId?: string | null
  logo?: string | null
  fssaiNo?: string | null
  cstDate?: string | null
  createdAt: string
  updatedAt: string
}

// Get all businesses for the current user
export async function getBusinesses() {
  return apiFetch<Business[]>('/api/businesses')
}

// Get a single business by ID (with auth check)
export async function getBusiness(businessId: string) {
  return apiFetch<Business>(`/api/businesses/${businessId}`)
}

// Create a new business
export async function createBusiness(data: {
  name: string
  type: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
  fssaiNo?: string
  cstDate?: string
}) {
  const business = await apiFetch<Business>('/api/businesses', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  revalidatePath('/')
  return business.id
}

// Update a business
export async function updateBusiness(businessId: string, data: any) {
  await apiFetch<Business>(`/api/businesses/${businessId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/')
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

// Delete a business
export async function deleteBusiness(businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}`, { method: 'DELETE' })
  revalidatePath('/')
}

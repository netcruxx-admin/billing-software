'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface Supplier {
  id: string
  businessId: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  taxId?: string | null
  createdAt: string
  updatedAt: string
}

export async function getSuppliers(businessId: string) {
  return apiFetch<Supplier[]>(`/api/businesses/${businessId}/suppliers`)
}

export async function getSupplier(supplierId: string, businessId: string) {
  return apiFetch<Supplier>(`/api/businesses/${businessId}/suppliers/${supplierId}`)
}

export async function createSupplier(businessId: string, data: {
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
}) {
  const supplier = await apiFetch<Supplier>(`/api/businesses/${businessId}/suppliers`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
  return supplier.id
}

export async function updateSupplier(supplierId: string, businessId: string, data: any) {
  await apiFetch<Supplier>(`/api/businesses/${businessId}/suppliers/${supplierId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

export async function deleteSupplier(supplierId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/suppliers/${supplierId}`, { method: 'DELETE' })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

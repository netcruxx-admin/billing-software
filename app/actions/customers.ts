'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface Customer {
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

export async function getCustomers(businessId: string) {
  return apiFetch<Customer[]>(`/api/businesses/${businessId}/customers`)
}

export async function getCustomer(customerId: string, businessId: string) {
  return apiFetch<Customer>(`/api/businesses/${businessId}/customers/${customerId}`)
}

export async function createCustomer(businessId: string, data: {
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
}) {
  const customer = await apiFetch<Customer>(`/api/businesses/${businessId}/customers`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
  return customer.id
}

export async function updateCustomer(customerId: string, businessId: string, data: any) {
  await apiFetch<Customer>(`/api/businesses/${businessId}/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

export async function deleteCustomer(customerId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/customers/${customerId}`, { method: 'DELETE' })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

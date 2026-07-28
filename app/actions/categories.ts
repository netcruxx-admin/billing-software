'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface Category {
  id: string
  businessId: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export async function getCategories(businessId: string) {
  return apiFetch<Category[]>(`/api/businesses/${businessId}/categories`)
}

export async function getCategory(categoryId: string, businessId: string) {
  return apiFetch<Category>(`/api/businesses/${businessId}/categories/${categoryId}`)
}

export async function createCategory(businessId: string, data: {
  name: string
  description?: string
}) {
  const category = await apiFetch<Category>(`/api/businesses/${businessId}/categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
  return category.id
}

export async function updateCategory(categoryId: string, businessId: string, data: any) {
  await apiFetch<Category>(`/api/businesses/${businessId}/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

export async function deleteCategory(categoryId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/categories/${categoryId}`, { method: 'DELETE' })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

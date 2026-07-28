'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface ProductVariant {
  id: string
  productId: string
  packSize?: string | null
  sku?: string | null
  price: number
  costPrice?: number | null
  mrp?: number | null
  quantity: number
  isLoose: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  businessId: string
  categoryId?: string | null
  name: string
  description?: string | null
  unit: string
  gstRate: number
  hsnCode?: string | null
  createdAt: string
  updatedAt: string
  variants: ProductVariant[]
}

export interface ProductVariantInput {
  id?: string
  packSize?: string
  sku?: string
  price: number
  costPrice?: number
  mrp?: number
  quantity?: number
  isLoose?: boolean
}

export async function getProducts(businessId: string) {
  return apiFetch<Product[]>(`/api/businesses/${businessId}/products`)
}

export async function getProduct(productId: string, businessId: string) {
  return apiFetch<Product>(`/api/businesses/${businessId}/products/${productId}`)
}

export async function createProduct(businessId: string, data: {
  name: string
  description?: string
  categoryId: string
  unit?: string
  gstRate?: number
  hsnCode?: string
  variants: ProductVariantInput[]
}) {
  const product = await apiFetch<Product>(`/api/businesses/${businessId}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
  return product.id
}

export async function updateProduct(productId: string, businessId: string, data: any) {
  await apiFetch<Product>(`/api/businesses/${businessId}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
  revalidatePath(`/dashboard/businesses/${businessId}/inventory/${productId}`)
}

export async function deleteProduct(productId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/products/${productId}`, { method: 'DELETE' })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

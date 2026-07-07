'use server'

import { demoDb } from '@/lib/demo-db'
import { revalidatePath } from 'next/cache'

export async function getProducts(businessId: string) {
  return demoDb.getProducts(businessId)
}

export async function getProduct(productId: string, businessId: string) {
  const prod = await demoDb.getProduct(businessId, productId)
  if (!prod) throw new Error('Product not found')
  return prod
}

export async function createProduct(businessId: string, data: {
  name: string
  description?: string
  sku?: string
  price: number
  costPrice?: number
  quantity?: number
  category?: string
}) {
  const product = await demoDb.createProduct(businessId, {
    ...data,
    quantity: data.quantity || 0,
  })
  revalidatePath(`/dashboard/businesses/${businessId}`)
  return product.id
}

export async function updateProduct(productId: string, businessId: string, data: any) {
  const prod = await demoDb.getProduct(businessId, productId)
  if (!prod) throw new Error('Product not found')

  Object.assign(prod, data, { updatedAt: new Date() })
  revalidatePath(`/dashboard/businesses/${businessId}`)
  revalidatePath(`/dashboard/businesses/${businessId}/inventory/${productId}`)
}

export async function deleteProduct(productId: string, businessId: string) {
  const deleted = await demoDb.deleteProduct(businessId, productId)
  if (!deleted) throw new Error('Product not found')
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

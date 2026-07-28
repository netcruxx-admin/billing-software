'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId?: string | null
  variantId?: string | null
  description: string
  quantity: number
  unit?: string | null
  unitPrice: number
  amount: number
  taxRate: number
  taxAmount: number
  hsnCode?: string | null
  createdAt: string
}

export interface TaxBreakdown {
  rate: number
  taxableAmount: number
  taxAmount: number
}

export interface Purchase {
  id: string
  businessId: string
  supplierId?: string | null
  purchaseNumber: string
  challanNumber?: string | null
  purchaseDate: string
  subtotal: number
  tax: number
  total: number
  notes?: string | null
  createdAt: string
  updatedAt: string
  supplierName?: string | null
}

export interface PurchaseDetail extends Purchase {
  items: PurchaseItem[]
  taxBreakdown: TaxBreakdown[]
}

export async function getPurchases(businessId: string) {
  return apiFetch<Purchase[]>(`/api/businesses/${businessId}/purchases`)
}

export async function getPurchase(purchaseId: string, businessId: string) {
  return apiFetch<PurchaseDetail>(`/api/businesses/${businessId}/purchases/${purchaseId}`)
}

export async function getPurchaseItems(purchaseId: string, businessId: string) {
  const purchase = await apiFetch<PurchaseDetail>(`/api/businesses/${businessId}/purchases/${purchaseId}`)
  return purchase.items
}

export async function createPurchase(businessId: string, data: {
  supplierId?: string
  purchaseDate: Date
  challanNumber?: string
  items: Array<{
    productId?: string
    variantId?: string
    description: string
    quantity: number
    unit?: string
    unitPrice: number
    taxRate?: number
    hsnCode?: string
  }>
  notes?: string
}) {
  const purchase = await apiFetch<PurchaseDetail>(`/api/businesses/${businessId}/purchases`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      purchaseDate: data.purchaseDate.toISOString(),
    }),
  })

  revalidatePath(`/dashboard/businesses/${businessId}`)
  return purchase.id
}

export async function deletePurchase(purchaseId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/purchases/${purchaseId}`, { method: 'DELETE' })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

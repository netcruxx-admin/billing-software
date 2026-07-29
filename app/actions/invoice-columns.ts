'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

export type InvoiceColumnType = 'text' | 'number'

export interface InvoiceColumn {
  id: string
  businessId: string
  key: string
  label: string
  fieldType: InvoiceColumnType
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export async function getInvoiceColumns(businessId: string) {
  return apiFetch<InvoiceColumn[]>(`/api/businesses/${businessId}/invoice-columns`)
}

export async function createInvoiceColumn(
  businessId: string,
  data: { label: string; fieldType: InvoiceColumnType }
) {
  await apiFetch<InvoiceColumn>(`/api/businesses/${businessId}/invoice-columns`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}/invoice-columns`)
}

export async function updateInvoiceColumn(
  columnId: string,
  businessId: string,
  data: { label?: string; fieldType?: InvoiceColumnType }
) {
  await apiFetch<InvoiceColumn>(`/api/businesses/${businessId}/invoice-columns/${columnId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath(`/dashboard/businesses/${businessId}/invoice-columns`)
}

export async function deleteInvoiceColumn(columnId: string, businessId: string) {
  await apiFetch<void>(`/api/businesses/${businessId}/invoice-columns/${columnId}`, { method: 'DELETE' })
  revalidatePath(`/dashboard/businesses/${businessId}/invoice-columns`)
}

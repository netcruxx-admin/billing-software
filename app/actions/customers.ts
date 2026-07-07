'use server'

import { demoDb } from '@/lib/demo-db'
import { revalidatePath } from 'next/cache'

export async function getCustomers(businessId: string) {
  return demoDb.getCustomers(businessId)
}

export async function getCustomer(customerId: string, businessId: string) {
  const cust = await demoDb.getCustomer(businessId, customerId)
  if (!cust) throw new Error('Customer not found')
  return cust
}

export async function createCustomer(businessId: string, data: {
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
}) {
  const customer = await demoDb.createCustomer(businessId, data)
  revalidatePath(`/dashboard/businesses/${businessId}`)
  return customer.id
}

export async function updateCustomer(customerId: string, businessId: string, data: any) {
  const cust = await demoDb.getCustomer(businessId, customerId)
  if (!cust) throw new Error('Customer not found')

  Object.assign(cust, data, { updatedAt: new Date() })
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

export async function deleteCustomer(customerId: string, businessId: string) {
  const deleted = await demoDb.deleteCustomer(businessId, customerId)
  if (!deleted) throw new Error('Customer not found')
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

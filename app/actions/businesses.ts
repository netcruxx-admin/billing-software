'use server'

import { demoDb } from '@/lib/demo-db'
import { revalidatePath } from 'next/cache'
import { demoUserId } from '@/lib/demo-auth'

/**
 * Get the current user id from demo session.
 * Every server action that touches user data uses this.
 */
async function getUserId() {
  return demoUserId
}

// Get all businesses for the current user
export async function getBusinesses() {
  const userId = await getUserId()
  return demoDb.getBusinesses(userId)
}

// Get a single business by ID (with auth check)
export async function getBusiness(businessId: string) {
  const business = await demoDb.getBusiness(businessId)
  if (!business) throw new Error('Business not found')
  return business
}

// Create a new business
export async function createBusiness(data: {
  name: string
  type: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
}) {
  const userId = await getUserId()
  const result = await demoDb.createBusiness({
    userId,
    name: data.name,
    type: data.type,
    address: data.address,
    phone: data.phone,
    email: data.email,
    taxId: data.taxId,
  })

  revalidatePath('/')
  return result.id
}

// Update a business
export async function updateBusiness(businessId: string, data: any) {
  const biz = await demoDb.getBusiness(businessId)
  if (!biz) throw new Error('Business not found')

  Object.assign(biz, data, { updatedAt: new Date() })
  revalidatePath('/')
  revalidatePath(`/dashboard/businesses/${businessId}`)
}

// Delete a business
export async function deleteBusiness(businessId: string) {
  const deleted = await demoDb.deleteBusiness(businessId)
  if (!deleted) throw new Error('Business not found')
  revalidatePath('/')
}

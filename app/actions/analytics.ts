'use server'

import { demoDb } from '@/lib/demo-db'

async function checkBusinessAccess(businessId: string) {
  const business = await demoDb.getBusiness(businessId)
  if (!business) throw new Error('Business not found')
  return business
}

export async function getAnalytics(businessId: string) {
  await checkBusinessAccess(businessId)

  const invoices = await demoDb.getInvoices(businessId)
  const payments = await demoDb.getPayments(businessId)

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const outstandingAmount = totalRevenue - totalPaid

  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length
  const unpaidInvoices = totalInvoices - paidInvoices

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return {
    metrics: {
      totalRevenue,
      totalPaid,
      outstandingAmount,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
    },
    recentInvoices,
  }
}

export async function getMonthlyRevenue(businessId: string) {
  await checkBusinessAccess(businessId)

  const invoices = await demoDb.getInvoices(businessId)

  // Group by month
  const monthlyData: Record<string, number> = {}
  for (const inv of invoices) {
    const date = new Date(inv.invoiceDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(inv.total)
  }

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({
      month,
      revenue,
    }))
}

export async function getInvoiceStatusBreakdown(businessId: string) {
  await checkBusinessAccess(businessId)

  const invoices = await demoDb.getInvoices(businessId)

  const breakdown = {
    draft: 0,
    sent: 0,
    partial: 0,
    paid: 0,
  }

  invoices.forEach((inv) => {
    if (breakdown[inv.status as keyof typeof breakdown] !== undefined) {
      breakdown[inv.status as keyof typeof breakdown]++
    }
  })

  return breakdown
}

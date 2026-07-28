import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number | string) {
  return inrFormatter.format(Number(amount) || 0)
}

// Standard Indian GST slabs.
export const GST_RATES = [0, 5, 12, 18, 28]

// Common units of measure for inventory quantities.
export const UNITS = [
  { value: 'pcs', label: 'Pcs' },
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'Gram' },
  { value: 'l', label: 'Litre' },
  { value: 'ml', label: 'ml' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
]

// Billing periods for service-style work (office businesses bill by time
// spent or milestones reached rather than a physical quantity).
export const TIME_UNITS = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'milestone', label: 'Milestone' },
]

export function unitLabel(unit?: string | null) {
  if (!unit) return 'Pcs'
  return (
    UNITS.find((u) => u.value === unit)?.label ??
    TIME_UNITS.find((u) => u.value === unit)?.label ??
    PACK_SIZES.find((p) => p.value === unit)?.label ??
    // Not a known preset — e.g. a loose sale's typed gram amount ("150g").
    // Show it as-is rather than falling back to a misleading "Pcs".
    unit
  )
}

// The invoice reference field's meaning depends on what kind of business is
// billing — a restaurant tracks a table/order, a hotel a room, a plain
// retail store has nothing equivalent to show.
export function invoiceReferenceLabel(businessType?: string | null): string | null {
  switch (businessType) {
    case 'restaurant':
    case 'cafe':
      return 'Table / Order No.'
    case 'hotel':
      return 'Room No.'
    default:
      return null
  }
}

// Restaurants, cafes, and office-work businesses keep the original simple
// invoice layout. Every other business type (store, hotel, other) gets the
// tabular GST retail-bill format (HSN/MRP/pack columns, GST-rate-wise
// summary, amount in words).
export function invoiceLayout(businessType?: string | null): 'restaurant' | 'retail' {
  return businessType === 'restaurant' || businessType === 'cafe' || businessType === 'office' ? 'restaurant' : 'retail'
}

export interface DashboardModuleLabels {
  inventory: { label: string; icon: string }
}

const DEFAULT_MODULE_LABELS: DashboardModuleLabels = {
  inventory: { label: 'Inventory', icon: '📦' },
}

// The "Inventory" tab is the same underlying product catalog for every
// business type, but what it *means* varies — a restaurant catalogs dishes,
// an office catalogs billable services, a store catalogs stock. This is the
// first of what should grow into a general business-type -> module config
// as more type-specific modules get built; only add an override here once a
// type's terminology actually differs, not speculatively.
const MODULE_LABELS_BY_TYPE: Record<string, DashboardModuleLabels> = {
  restaurant: { inventory: { label: 'Menu', icon: '🍽️' } },
  cafe: { inventory: { label: 'Menu', icon: '🍽️' } },
  office: { inventory: { label: 'Services', icon: '🧰' } },
}

export function dashboardModuleLabels(businessType?: string | null): DashboardModuleLabels {
  return (businessType && MODULE_LABELS_BY_TYPE[businessType]) || DEFAULT_MODULE_LABELS
}

// Payment modes for retail-format invoices.
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'credit', label: 'Credit' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
]

export function paymentModeLabel(mode?: string | null) {
  return PAYMENT_MODES.find((m) => m.value === mode)?.label ?? null
}

// Methods used when recording a payment received against an invoice
// (distinct from PAYMENT_MODES, which is the invoice's own header field).
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI/Online Payment' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
]

export function paymentMethodLabel(method?: string | null) {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? (method ? method.replace('_', ' ') : null)
}

// Recognized pack-weight shorthand — a product's variant "Pack Size" is a
// free-text field (it covers weights like "50g" as well as price points
// like "₹10 Pack"), but when someone does type one of these, unitLabel()
// renders it with a friendlier label instead of showing the raw value.
// `loose` is kept only for invoices created before per-product pack sizes
// existed.
export const PACK_SIZES = [
  { value: 'loose', label: 'Loose (gms)' },
  { value: '50g', label: '50gm' },
  { value: '100g', label: '100gm' },
  { value: '250g', label: '250gm' },
  { value: '500g', label: '500gm' },
  { value: '1kg', label: '1kg' },
]

// Converts a product's per-kg price to a per-gram rate. Loose (weighed)
// sales record their invoice quantity as the exact grams sold, so the line
// total (quantity * rate) comes out right only if the rate is per-gram, not
// per-kg — e.g. ₹897/kg -> ₹0.897/g, billing ₹224.25 for 250 grams.
export function pricePerGram(pricePerKg: number): number {
  return pricePerKg / 1000
}

// The retail invoice's "Qty" column needs to show the actual amount sold
// (e.g. "150 Gram" or "2 Box"), not just a bare unit label — but invoices
// created before loose/box quantities existed stored the pack size itself
// as the unit (e.g. "250g", "loose") with an implicit quantity of one, and
// re-printing those with a "1" prefixed in front would misrepresent them.
export function retailQtyLabel(quantity: number | string | null | undefined, unit?: string | null): string {
  if (unit && PACK_SIZES.some((p) => p.value === unit)) return unitLabel(unit)
  const qty = quantity == null || quantity === '' ? 1 : Number(quantity)
  return `${qty} ${unitLabel(unit)}`
}

// How an invoice line's quantity is entered: a plain pack/piece count
// ("unit" — the default, however the pack size reads: "50gm", "₹10 Pack",
// a box, etc.) or an exact weight in grams for a bulk item sold loose at
// the counter ("loose"). Independent of the pack size label itself.
export const SOLD_BY_OPTIONS = [
  { value: 'unit', label: 'Piece' },
  { value: 'loose', label: 'Loose' },
]

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function threeDigitsToWords(n: number): string {
  const parts: string[] = []
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`)
    n %= 100
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)])
    n %= 10
    if (n > 0) parts.push(ONES[n])
  } else if (n > 0) {
    parts.push(ONES[n])
  }
  return parts.join(' ')
}

// Converts a rupee amount to words using the Indian numbering system
// (thousand / lakh / crore), e.g. 161000 -> "One Lakh Sixty One Thousand".
// Amount is rounded to the nearest rupee first — invoices spell out the
// post-round-off whole-rupee total, not paise.
export function numberToWords(amount: number): string {
  let n = Math.round(Math.abs(amount))
  if (n === 0) return 'Zero'

  const crore = Math.floor(n / 10000000)
  n %= 10000000
  const lakh = Math.floor(n / 100000)
  n %= 100000
  const thousand = Math.floor(n / 1000)
  n %= 1000
  const hundred = n

  const segments: string[] = []
  if (crore > 0) segments.push(`${threeDigitsToWords(crore)} Crore`)
  if (lakh > 0) segments.push(`${threeDigitsToWords(lakh)} Lakh`)
  if (thousand > 0) segments.push(`${threeDigitsToWords(thousand)} Thousand`)
  if (hundred > 0) segments.push(threeDigitsToWords(hundred))

  return segments.join(' ')
}

export interface TaxRateBucket {
  rate: number
  taxableAmount: number
  taxAmount: number
}

// Groups invoice line items by GST rate, including the 0% ("tax-free")
// bucket — unlike the backend's tax_breakdown, which drops 0% items since
// the original invoice template has no use for a zero-rate line. The retail
// bill format shows a "GST Sale Taxfree" row, so it needs the full grouping.
export function groupByTaxRateIncludingZero(
  items: Array<{ amount: string | number; taxRate?: number | null; taxAmount?: string | number | null }>
): TaxRateBucket[] {
  const groups = new Map<number, { taxableAmount: number; taxAmount: number }>()
  for (const item of items) {
    const rate = Number(item.taxRate) || 0
    const bucket = groups.get(rate) ?? { taxableAmount: 0, taxAmount: 0 }
    bucket.taxableAmount += Number(item.amount) || 0
    bucket.taxAmount += Number(item.taxAmount) || 0
    groups.set(rate, bucket)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([rate, v]) => ({
      rate,
      taxableAmount: Math.round(v.taxableAmount * 100) / 100,
      taxAmount: Math.round(v.taxAmount * 100) / 100,
    }))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// India's GST is split evenly into CGST + SGST for intra-state sales (the
// common case for a single-location small business). The remainder cent, if
// any, is folded into SGST so the two halves always add back up to `tax`.
export function splitGst(tax: number, taxRate: number) {
  const cgstRate = taxRate / 2
  const sgstRate = taxRate / 2
  const cgstAmount = Math.round((tax / 2) * 100) / 100
  const sgstAmount = Math.round((tax - cgstAmount) * 100) / 100
  return { cgstRate, sgstRate, cgstAmount, sgstAmount }
}

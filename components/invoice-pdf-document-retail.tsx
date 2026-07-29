import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import {
  formatDate,
  groupByTaxRateIncludingZero,
  numberToWords,
  paymentModeLabel,
  retailQtyLabel,
  splitGst,
  type CustomFieldColumn,
} from '@/lib/utils'

const inr = (amount: number) => `Rs. ${amount.toFixed(2)}`

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, color: '#1a1a1a', fontFamily: 'Helvetica' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontWeight: 700 },
  muted: { color: '#666666' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  title: { fontSize: 13, fontWeight: 700 },
  businessName: { fontSize: 16, fontWeight: 700, textAlign: 'center' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a', paddingBottom: 6, marginBottom: 6 },
  label: { fontSize: 7, fontWeight: 700, color: '#666666', letterSpacing: 1, marginBottom: 3 },
  customFields: { fontSize: 6, color: '#666666', marginTop: 1 },
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#1a1a1a' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  tableRow: {
    flexDirection: 'row',
  },
  cellBase: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  colSn: { width: '4%', textAlign: 'center' },
  colItem: { width: '12%' },
  colCategory: { width: '9%' },
  colHsn: { width: '9%' },
  colPack: { width: '9%' },
  colMrp: { width: '9%', textAlign: 'right' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '9%', textAlign: 'right' },
  colCd: { width: '6%', textAlign: 'right' },
  colGift: { width: '7%' },
  colTax: { width: '6%', textAlign: 'right' },
  colGross: { width: '10%', textAlign: 'right' },
  totalsBox: { width: 220, marginLeft: 'auto' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 },
  totalsFinal: { borderTopWidth: 1, borderTopColor: '#cccccc', marginTop: 3, paddingTop: 3 },
  summaryTable: { width: '55%' },
  summaryRow: { flexDirection: 'row', paddingVertical: 1, borderBottomWidth: 0.5, borderBottomColor: '#eeeeee' },
  summaryLabel: { width: '40%' },
  summaryVal: { width: '20%', textAlign: 'right' },
  footer: { marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#cccccc', fontSize: 7, color: '#666666' },
})

interface InvoicePdfDocumentRetailProps {
  business: {
    name: string
    type?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    taxId?: string | null
    fssaiNo?: string | null
    cstDate?: string | null
  }
  customer?: {
    name: string
    taxId?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
  } | null
  invoice: {
    invoiceNumber: string
    invoiceDate: Date | string
    deliveryDate?: Date | string | null
    paymentMode?: string | null
    subtotal: string | number
    tax: string | number
    total: string | number
    paidAmount?: string | number | null
    notes?: string | null
  }
  items: Array<{
    id: string
    description: string
    quantity: number | null
    unit?: string | null
    unitPrice: string | number
    amount: string | number
    taxRate?: number | null
    taxAmount?: string | number | null
    hsnCode?: string | null
    mrp?: string | number | null
    packSize?: string | null
    categoryName?: string | null
    cdRate?: number | null
    giftNote?: string | null
    discountAmount?: string | number | null
    customFields?: Record<string, string> | null
  }>
  customColumns?: CustomFieldColumn[]
}

// Compact "Label: value · Label: value" line under the item name — simpler
// and more robust in a fixed-percentage-width PDF table than recalculating
// column widths for however many custom fields a business has defined.
const customFieldsLine = (item: { customFields?: Record<string, string> | null }, customColumns: CustomFieldColumn[]) =>
  customColumns
    .filter((col) => item.customFields?.[col.key])
    .map((col) => `${col.label}: ${item.customFields![col.key]}`)
    .join('  ·  ')

export function InvoicePdfDocumentRetail({ business, customer, invoice, items, customColumns = [] }: InvoicePdfDocumentRetailProps) {
  const subtotal = Number(invoice.subtotal) || 0
  const total = Number(invoice.total) || 0
  const roundedTotal = Math.round(total)
  const roundOff = Math.round((roundedTotal - total) * 100) / 100
  const taxBuckets = groupByTaxRateIncludingZero(items)
  const totalTax = taxBuckets.reduce((sum, b) => sum + b.taxAmount, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.row, styles.divider]}>
          <Text>GST No. :{business.taxId || '—'}</Text>
          <Text style={styles.title}>TAX INVOICE</Text>
          <Text>{business.phone ? `PH ${business.phone}` : ''}</Text>
        </View>

        <View style={[styles.divider, { alignItems: 'center' }]}>
          <Text style={styles.businessName}>{business.name}</Text>
          {business.address && <Text style={styles.center}>{business.address}</Text>}
          <View style={[styles.row, { width: '100%', marginTop: 3 }]}>
            <Text>{business.cstDate ? `CST DT. :${formatDate(business.cstDate)}` : ''}</Text>
            <Text>{business.fssaiNo ? `FSSAI NO- ${business.fssaiNo}` : ''}</Text>
          </View>
        </View>

        <View style={[styles.row, styles.divider]}>
          <View style={{ width: '50%' }}>
            <Text style={styles.bold}>M/S : {customer?.name ?? 'CUSTOMER'}</Text>
            {customer?.taxId && <Text>GST No.: {customer.taxId}</Text>}
            {customer?.address && <Text>{customer.address}</Text>}
            {customer?.phone && <Text>Phone No.: {customer.phone}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Bill No.:  </Text>
              <Text style={styles.bold}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Date:  </Text>
              <Text style={styles.bold}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            {invoice.deliveryDate && (
              <View style={styles.totalsRow}>
                <Text style={styles.muted}>Delivery Date:  </Text>
                <Text style={styles.bold}>{formatDate(invoice.deliveryDate)}</Text>
              </View>
            )}
            {invoice.paymentMode && (
              <View style={styles.totalsRow}>
                <Text style={styles.muted}>Mode:  </Text>
                <Text style={styles.bold}>{paymentModeLabel(invoice.paymentMode) ?? invoice.paymentMode}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellBase, styles.colSn, styles.bold]}>SN</Text>
            <Text style={[styles.cellBase, styles.colItem, styles.bold]}>Item Name</Text>
            <Text style={[styles.cellBase, styles.colCategory, styles.bold]}>Category</Text>
            <Text style={[styles.cellBase, styles.colHsn, styles.bold]}>HSN Code</Text>
            <Text style={[styles.cellBase, styles.colPack, styles.bold]}>Pack</Text>
            <Text style={[styles.cellBase, styles.colMrp, styles.bold]}>MRP</Text>
            <Text style={[styles.cellBase, styles.colQty, styles.bold]}>Qty</Text>
            <Text style={[styles.cellBase, styles.colRate, styles.bold]}>Rate</Text>
            <Text style={[styles.cellBase, styles.colCd, styles.bold]}>CD%</Text>
            <Text style={[styles.cellBase, styles.colGift, styles.bold]}>Gift</Text>
            <Text style={[styles.cellBase, styles.colTax, styles.bold]}>Tax%</Text>
            <Text style={[styles.cellBase, styles.colGross, styles.bold]}>Gross Amt</Text>
          </View>
          {items.map((item, index) => {
            const amount = Number(item.amount) || 0
            const discountAmount = Number(item.discountAmount) || 0
            const grossAmt = amount + discountAmount
            const fieldsLine = customFieldsLine(item, customColumns)
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.cellBase, styles.colSn]}>{index + 1}</Text>
                <View style={[styles.cellBase, styles.colItem]}>
                  <Text>{item.description}</Text>
                  {fieldsLine && <Text style={styles.customFields}>{fieldsLine}</Text>}
                </View>
                <Text style={[styles.cellBase, styles.colCategory]}>{item.categoryName || '—'}</Text>
                <Text style={[styles.cellBase, styles.colHsn]}>{item.hsnCode || '—'}</Text>
                <Text style={[styles.cellBase, styles.colPack]}>{item.packSize || '—'}</Text>
                <Text style={[styles.cellBase, styles.colMrp]}>{item.mrp != null ? inr(Number(item.mrp)) : '—'}</Text>
                <Text style={[styles.cellBase, styles.colQty]}>{retailQtyLabel(item.quantity, item.unit)}</Text>
                <Text style={[styles.cellBase, styles.colRate]}>{inr(Number(item.unitPrice))}</Text>
                <Text style={[styles.cellBase, styles.colCd]}>{(Number(item.cdRate) || 0).toFixed(2)}</Text>
                <Text style={[styles.cellBase, styles.colGift]}>{item.giftNote || '—'}</Text>
                <Text style={[styles.cellBase, styles.colTax]}>{(Number(item.taxRate) || 0).toFixed(2)}</Text>
                <Text style={[styles.cellBase, styles.colGross]}>{inr(grossAmt)}</Text>
              </View>
            )
          })}
        </View>

        <View style={[styles.row, { marginTop: 12 }]}>
          <View style={styles.summaryTable}>
            <Text style={styles.label}>GST-RATE-WISE SUMMARY</Text>
            {taxBuckets.map((b) => {
              const { sgstAmount, cgstAmount } = splitGst(b.taxAmount, b.rate)
              return (
                <View key={b.rate} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{b.rate === 0 ? 'GST Sale Taxfree' : `GST Sale ${b.rate}%`}</Text>
                  <Text style={styles.summaryVal}>{inr(b.taxableAmount)}</Text>
                  <Text style={styles.summaryVal}>{b.rate === 0 ? '—' : inr(sgstAmount)}</Text>
                  <Text style={styles.summaryVal}>{b.rate === 0 ? '—' : inr(cgstAmount)}</Text>
                </View>
              )
            })}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Total:</Text>
              <Text>{inr(subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>SGST:</Text>
              <Text>{inr(totalTax / 2)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>CGST:</Text>
              <Text>{inr(totalTax / 2)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Round Off:</Text>
              <Text>{inr(roundOff)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsFinal]}>
              <Text style={styles.bold}>Net Amount:</Text>
              <Text style={styles.bold}>{inr(roundedTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text>Rs.: {numberToWords(roundedTotal)} Only</Text>
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>NOTES / TERMS</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>E. &amp; O.E.</Text>
        </View>
      </Page>
    </Document>
  )
}

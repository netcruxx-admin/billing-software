import { Fragment } from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatDate, invoiceReferenceLabel, splitGst, unitLabel, type CustomFieldColumn } from '@/lib/utils'

const inr = (amount: number) => `Rs. ${amount.toFixed(2)}`

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#1a1a1a', fontFamily: 'Helvetica' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    paddingTop: 10,
  },
  title: { fontSize: 24, fontWeight: 300, color: '#333333' },
  bold: { fontWeight: 700 },
  muted: { color: '#666666' },
  section: { marginBottom: 24 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#cccccc', marginBottom: 16, paddingBottom: 16 },
  label: { fontSize: 8, fontWeight: 700, color: '#666666', letterSpacing: 1, marginBottom: 4 },
  customFields: { fontSize: 8, color: '#666666', marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingVertical: 6,
  },
  colDesc: { width: '40%' },
  colQty: { width: '20%', textAlign: 'right' },
  colPrice: { width: '20%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  totalsBox: { width: 220, marginLeft: 'auto' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalsFinal: { borderTopWidth: 1, borderTopColor: '#cccccc', marginTop: 4, paddingTop: 4 },
  footer: { marginTop: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#cccccc', fontSize: 8, color: '#666666' },
})

interface InvoicePdfDocumentProps {
  business: {
    name: string
    type?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    taxId?: string | null
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
    dueDate?: Date | string | null
    subtotal: string | number
    tax: string | number
    total: string | number
    paidAmount?: string | number | null
    notes?: string | null
    referenceNote?: string | null
    taxBreakdown?: Array<{ rate: number; taxableAmount: number; taxAmount: number }>
  }
  items: Array<{
    id: string
    description: string
    quantity: number | null
    unit?: string | null
    unitPrice: string | number
    amount: string | number
    customFields?: Record<string, string> | null
  }>
  customColumns?: CustomFieldColumn[]
}

// Compact "Label: value · Label: value" line shown under the description —
// simpler and more robust in a fixed-percentage-width PDF table than adding
// more columns whose widths would need recalculating for every custom field.
const customFieldsLine = (item: { customFields?: Record<string, string> | null }, customColumns: CustomFieldColumn[]) =>
  customColumns
    .filter((col) => item.customFields?.[col.key])
    .map((col) => `${col.label}: ${item.customFields![col.key]}`)
    .join('  ·  ')

export function InvoicePdfDocument({ business, customer, invoice, items, customColumns = [] }: InvoicePdfDocumentProps) {
  const subtotal = Number(invoice.subtotal) || 0
  const total = Number(invoice.total) || 0
  const paidAmount = Number(invoice.paidAmount) || 0
  const amountDue = total - paidAmount
  const taxBreakdown = invoice.taxBreakdown ?? []
  const referenceLabel = invoiceReferenceLabel(business.type)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.row, styles.section]}>
          <Text style={styles.logo}>{business.name.charAt(0).toUpperCase()}</Text>
          <Text style={styles.title}>INVOICE</Text>
        </View>

        <View style={[styles.row, styles.section]}>
          <View />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bold}>{business.name}</Text>
            {business.address && <Text>{business.address}</Text>}
            {business.phone && <Text>{business.phone}</Text>}
            {business.email && <Text>{business.email}</Text>}
          </View>
        </View>

        <View style={[styles.row, styles.divider]}>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>BILL TO</Text>
            {customer ? (
              <>
                <Text style={styles.bold}>{customer.name}</Text>
                {customer.taxId && <Text>GSTIN:- {customer.taxId}</Text>}
                {customer.address && <Text>{customer.address}</Text>}
                {customer.phone && <Text>{customer.phone}</Text>}
                {customer.email && <Text>{customer.email}</Text>}
              </>
            ) : (
              <Text style={styles.muted}>Walk-in customer</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Invoice Number:  </Text>
              <Text style={styles.bold}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Invoice Date:  </Text>
              <Text style={styles.bold}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.totalsRow}>
                <Text style={styles.muted}>Payment Due:  </Text>
                <Text style={styles.bold}>{formatDate(invoice.dueDate)}</Text>
              </View>
            )}
            {referenceLabel && invoice.referenceNote && (
              <View style={styles.totalsRow}>
                <Text style={styles.muted}>{referenceLabel}:  </Text>
                <Text style={styles.bold}>{invoice.referenceNote}</Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Amount Due (INR):  </Text>
              <Text style={styles.bold}>{inr(amountDue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, styles.bold]}>Product/Service</Text>
          <Text style={[styles.colQty, styles.bold]}>Quantity</Text>
          <Text style={[styles.colPrice, styles.bold]}>Price</Text>
          <Text style={[styles.colAmount, styles.bold]}>Amount</Text>
        </View>
        {items.map((item) => {
          const fieldsLine = customFieldsLine(item, customColumns)
          return (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text>{item.description}</Text>
                {fieldsLine && <Text style={styles.customFields}>{fieldsLine}</Text>}
              </View>
              <Text style={styles.colQty}>{item.quantity != null ? `${item.quantity} ${unitLabel(item.unit)}` : '—'}</Text>
              <Text style={styles.colPrice}>{inr(Number(item.unitPrice))}</Text>
              <Text style={styles.colAmount}>{inr(Number(item.amount))}</Text>
            </View>
          )
        })}

        <View style={[styles.totalsBox, { marginTop: 16 }]}>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Subtotal:</Text>
            <Text>{inr(subtotal)}</Text>
          </View>
          {taxBreakdown.map((b) => {
            const { cgstRate, sgstRate, cgstAmount, sgstAmount } = splitGst(b.taxAmount, b.rate)
            return (
              <Fragment key={b.rate}>
                <View style={styles.totalsRow}>
                  <Text style={styles.muted}>SGST {sgstRate}%:</Text>
                  <Text>{inr(sgstAmount)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.muted}>CGST {cgstRate}%:</Text>
                  <Text>{inr(cgstAmount)}</Text>
                </View>
              </Fragment>
            )
          })}
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.bold}>Total:</Text>
            <Text style={styles.bold}>{inr(total)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.bold}>Amount Due (INR):</Text>
            <Text style={styles.bold}>{inr(amountDue)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>NOTES / TERMS</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {business.taxId && (
          <View style={styles.footer}>
            <Text>GSTIN: {business.taxId}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

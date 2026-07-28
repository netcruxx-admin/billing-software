'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { InvoicePdfDocument } from '@/components/invoice-pdf-document'
import { InvoicePdfDocumentRetail } from '@/components/invoice-pdf-document-retail'
import { cn, invoiceLayout } from '@/lib/utils'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <Button disabled>Preparing PDF...</Button>
    ),
  }
)

interface InvoicePrintActionsProps {
  invoiceUrl: string
  fileName: string
  business: React.ComponentProps<typeof InvoicePdfDocument>['business'] & React.ComponentProps<typeof InvoicePdfDocumentRetail>['business']
  customer: React.ComponentProps<typeof InvoicePdfDocument>['customer'] & React.ComponentProps<typeof InvoicePdfDocumentRetail>['customer']
  invoice: React.ComponentProps<typeof InvoicePdfDocument>['invoice'] & React.ComponentProps<typeof InvoicePdfDocumentRetail>['invoice']
  items: React.ComponentProps<typeof InvoicePdfDocument>['items'] & React.ComponentProps<typeof InvoicePdfDocumentRetail>['items']
}

export function InvoicePrintActions({ invoiceUrl, fileName, business, customer, invoice, items }: InvoicePrintActionsProps) {
  const layout = invoiceLayout(business.type)
  const document = layout === 'retail'
    ? <InvoicePdfDocumentRetail business={business} customer={customer} invoice={invoice} items={items} />
    : <InvoicePdfDocument business={business} customer={customer} invoice={invoice} items={items} />

  return (
    <div className="print:hidden sticky top-0 z-10 bg-background border-b border-border">
      <div className="max-w-3xl mx-auto px-10 py-4 flex items-center justify-between">
        <Link href={invoiceUrl} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Invoice
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          <PDFDownloadLink
            document={document}
            fileName={fileName}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            {({ loading }: { loading: boolean }) => (loading ? 'Preparing PDF...' : 'Download PDF')}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  )
}

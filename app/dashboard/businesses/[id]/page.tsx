import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBusiness, deleteBusiness } from '@/app/actions/businesses'
import { getInvoices } from '@/app/actions/invoices'
import { getCustomers } from '@/app/actions/customers'
import { getProducts } from '@/app/actions/products'
import { getBusinessPayments } from '@/app/actions/payments'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { InvoiceList } from '@/components/invoice-list'
import { ProductList } from '@/components/product-list'
import { CustomerList } from '@/components/customer-list'
import { PaymentList } from '@/components/payment-list'
import { DeleteButton } from '@/components/delete-button'

type BusinessDetailsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const VALID_TABS = ['invoices', 'inventory', 'customers', 'payments', 'analytics']

export default async function BusinessDetailsPage({ params, searchParams }: BusinessDetailsPageProps) {
  const { id: businessId } = await params
  const { tab } = await searchParams
  const defaultTab = VALID_TABS.includes(tab ?? '') ? (tab as string) : 'invoices'

  try {
    const [business, invoices, customers, products, payments] = await Promise.all([
      getBusiness(businessId),
      getInvoices(businessId),
      getCustomers(businessId),
      getProducts(businessId),
      getBusinessPayments(businessId),
    ])

    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">{business.name}</h1>
              <p className="text-muted-foreground mt-2">
                {business.type?.charAt(0).toUpperCase() + business.type?.slice(1)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/businesses/${businessId}/edit`}>
                <Button variant="outline">Edit Business</Button>
              </Link>
              <DeleteButton
                action={deleteBusiness.bind(null, businessId)}
                confirmMessage={`Delete ${business.name} and all of its invoices, products, customers and payments? This cannot be undone.`}
                label="Delete Business"
                redirectTo="/"
              />
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="mt-6">
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
                  <Link href={`/dashboard/businesses/${businessId}/invoices/new`}>
                    <Button>New Invoice</Button>
                  </Link>
                </div>
                {invoices.length === 0 ? (
                  <p className="text-muted-foreground">No invoices yet. Create your first invoice to get started.</p>
                ) : (
                  <InvoiceList invoices={invoices} businessId={businessId} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Products & Inventory ({products.length})</h2>
                  <Link href={`/dashboard/businesses/${businessId}/inventory/new`}>
                    <Button>Add Product</Button>
                  </Link>
                </div>
                {products.length === 0 ? (
                  <p className="text-muted-foreground">No products yet. Add items to your inventory.</p>
                ) : (
                  <ProductList products={products} businessId={businessId} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="customers" className="mt-6">
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Customers ({customers.length})</h2>
                  <Link href={`/dashboard/businesses/${businessId}/customers/new`}>
                    <Button>Add Customer</Button>
                  </Link>
                </div>
                {customers.length === 0 ? (
                  <p className="text-muted-foreground">No customers yet. Add customers to your business.</p>
                ) : (
                  <CustomerList customers={customers} businessId={businessId} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <div className="bg-card border border-border rounded-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Payments</h2>
                {payments.length === 0 ? (
                  <p className="text-muted-foreground">No payments yet. Payments will appear here when invoices are paid.</p>
                ) : (
                  <PaymentList payments={payments} businessId={businessId} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Sales Analytics</h2>
                  <Link href={`/dashboard/businesses/${businessId}/analytics`}>
                    <Button>View Full Analytics</Button>
                  </Link>
                </div>
                <p className="text-muted-foreground">Click the button above to view detailed analytics and reports for your business.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load business:', error)
    redirect('/')
  }
}

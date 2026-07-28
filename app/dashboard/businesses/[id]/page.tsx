import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBusiness, deleteBusiness } from '@/app/actions/businesses'
import { getInvoices } from '@/app/actions/invoices'
import { getCustomers } from '@/app/actions/customers'
import { getProducts } from '@/app/actions/products'
import { getCategories } from '@/app/actions/categories'
import { getBusinessPayments } from '@/app/actions/payments'
import { getPurchases } from '@/app/actions/purchases'
import { getSuppliers } from '@/app/actions/suppliers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { InvoiceList } from '@/components/invoice-list'
import { ProductList } from '@/components/product-list'
import { CategoryList } from '@/components/category-list'
import { CustomerList } from '@/components/customer-list'
import { PaymentList } from '@/components/payment-list'
import { PurchaseList } from '@/components/purchase-list'
import { SupplierList } from '@/components/supplier-list'
import { DeleteButton } from '@/components/delete-button'

type BusinessDetailsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const VALID_TABS = ['invoices', 'inventory', 'purchases', 'customers', 'payments', 'analytics']

export default async function BusinessDetailsPage({ params, searchParams }: BusinessDetailsPageProps) {
  const { id: businessId } = await params
  const { tab } = await searchParams
  const defaultTab = VALID_TABS.includes(tab ?? '') ? (tab as string) : 'invoices'

  try {
    const [business, invoices, customers, products, categories, payments, purchases, suppliers] = await Promise.all([
      getBusiness(businessId),
      getInvoices(businessId),
      getCustomers(businessId),
      getProducts(businessId),
      getCategories(businessId),
      getBusinessPayments(businessId),
      getPurchases(businessId),
      getSuppliers(businessId),
    ])

    const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]))
    const productCounts = products.reduce((acc: Record<string, number>, p) => {
      if (p.categoryId) acc[p.categoryId] = (acc[p.categoryId] || 0) + 1
      return acc
    }, {})

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
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
              <div className="bg-card border border-border rounded-lg p-8 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Categories ({categories.length})</h2>
                  <Link href={`/dashboard/businesses/${businessId}/categories/new`}>
                    <Button variant="outline">Add Category</Button>
                  </Link>
                </div>
                {categories.length === 0 ? (
                  <p className="text-muted-foreground">
                    No categories yet. Add a category first — products are organized inside categories.
                  </p>
                ) : (
                  <CategoryList categories={categories} businessId={businessId} productCounts={productCounts} />
                )}
              </div>

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
                  <ProductList products={products} businessId={businessId} categoryNames={categoryNames} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="purchases" className="mt-6">
              <div className="bg-card border border-border rounded-lg p-8 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Suppliers ({suppliers.length})</h2>
                  <Link href={`/dashboard/businesses/${businessId}/suppliers/new`}>
                    <Button variant="outline">Add Supplier</Button>
                  </Link>
                </div>
                {suppliers.length === 0 ? (
                  <p className="text-muted-foreground">No suppliers yet. Add a supplier to track who you buy from.</p>
                ) : (
                  <SupplierList suppliers={suppliers} businessId={businessId} />
                )}
              </div>

              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Purchases ({purchases.length})</h2>
                  <Link href={`/dashboard/businesses/${businessId}/purchases/new`}>
                    <Button>Record Purchase</Button>
                  </Link>
                </div>
                {purchases.length === 0 ? (
                  <p className="text-muted-foreground">No purchases yet. Record a purchase to receive stock and generate a purchase challan.</p>
                ) : (
                  <PurchaseList purchases={purchases} businessId={businessId} />
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

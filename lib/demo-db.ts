import { nanoid } from 'nanoid'

// In-memory database for demo. Data lives for the lifetime of the server
// process and resets on restart.
const store = {
  businesses: [] as any[],
  products: [] as any[],
  customers: [] as any[],
  invoices: [] as any[],
  invoiceItems: [] as any[],
  payments: [] as any[],
}

export const demoDb = {
  // Business operations
  async createBusiness(data: any) {
    const business = {
      id: nanoid(),
      userId: 'demo-user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }
    store.businesses.push(business)
    return business
  },

  async getBusinesses(userId: string) {
    return store.businesses.filter(b => b.userId === userId)
  },

  async getBusiness(id: string) {
    return store.businesses.find(b => b.id === id)
  },

  async deleteBusiness(id: string) {
    const idx = store.businesses.findIndex(b => b.id === id)
    if (idx === -1) return false
    store.businesses.splice(idx, 1)

    // Cascade delete everything scoped to this business.
    const invoiceIds = store.invoices.filter(i => i.businessId === id).map(i => i.id)
    store.invoiceItems = store.invoiceItems.filter(item => !invoiceIds.includes(item.invoiceId))
    store.invoices = store.invoices.filter(i => i.businessId !== id)
    store.products = store.products.filter(p => p.businessId !== id)
    store.customers = store.customers.filter(c => c.businessId !== id)
    store.payments = store.payments.filter(p => p.businessId !== id)
    return true
  },

  // Product operations
  async createProduct(businessId: string, data: any) {
    const product = {
      id: nanoid(),
      businessId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }
    store.products.push(product)
    return product
  },

  async getProducts(businessId: string) {
    return store.products.filter(p => p.businessId === businessId)
  },

  async getProduct(businessId: string, productId: string) {
    return store.products.find(p => p.businessId === businessId && p.id === productId)
  },

  async deleteProduct(businessId: string, productId: string) {
    const idx = store.products.findIndex(p => p.businessId === businessId && p.id === productId)
    if (idx === -1) return false
    store.products.splice(idx, 1)
    return true
  },

  async adjustProductStock(productId: string, delta: number) {
    const product = store.products.find(p => p.id === productId)
    if (!product) return
    product.quantity = Math.max(0, (product.quantity || 0) + delta)
    product.updatedAt = new Date()
  },

  // Customer operations
  async createCustomer(businessId: string, data: any) {
    const customer = {
      id: nanoid(),
      businessId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }
    store.customers.push(customer)
    return customer
  },

  async getCustomers(businessId: string) {
    return store.customers.filter(c => c.businessId === businessId)
  },

  async getCustomer(businessId: string, customerId: string) {
    return store.customers.find(c => c.businessId === businessId && c.id === customerId)
  },

  async deleteCustomer(businessId: string, customerId: string) {
    const idx = store.customers.findIndex(c => c.businessId === businessId && c.id === customerId)
    if (idx === -1) return false
    store.customers.splice(idx, 1)
    return true
  },

  // Invoice operations
  async createInvoice(businessId: string, data: any) {
    const invoice = {
      id: nanoid(),
      businessId,
      status: 'draft',
      paidAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }
    store.invoices.push(invoice)
    return invoice
  },

  async getInvoices(businessId: string) {
    return store.invoices.filter(i => i.businessId === businessId)
  },

  async getInvoice(id: string) {
    return store.invoices.find(i => i.id === id)
  },

  async deleteInvoice(businessId: string, invoiceId: string) {
    const idx = store.invoices.findIndex(i => i.businessId === businessId && i.id === invoiceId)
    if (idx === -1) return false
    store.invoices.splice(idx, 1)
    store.invoiceItems = store.invoiceItems.filter(item => item.invoiceId !== invoiceId)
    store.payments = store.payments.filter(p => p.invoiceId !== invoiceId)
    return true
  },

  async updateInvoicePayment(invoiceId: string, paidAmount: number, status: string) {
    const invoice = store.invoices.find(i => i.id === invoiceId)
    if (!invoice) return
    invoice.paidAmount = paidAmount
    invoice.status = status
    invoice.updatedAt = new Date()
  },

  // Invoice item operations
  async createInvoiceItem(invoiceId: string, data: any) {
    const item = {
      id: nanoid(),
      invoiceId,
      createdAt: new Date(),
      ...data,
    }
    store.invoiceItems.push(item)
    return item
  },

  async getInvoiceItems(invoiceId: string) {
    return store.invoiceItems.filter(i => i.invoiceId === invoiceId)
  },

  // Payment operations
  async createPayment(businessId: string, data: any) {
    const payment = {
      id: nanoid(),
      businessId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }
    store.payments.push(payment)
    return payment
  },

  async getPayments(businessId: string) {
    return store.payments.filter(p => p.businessId === businessId)
  },

  async getPaymentsByInvoice(invoiceId: string) {
    return store.payments
      .filter(p => p.invoiceId === invoiceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },
}

import { pgTable, text, timestamp, boolean, decimal } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Add your app tables below. Always include a plain `userId` column so queries
// can be scoped per user — the security model depends on this column existing,
// not on a foreign key. Do NOT add a foreign key constraint
// (`.references(() => user.id, ...)`) unless the user explicitly asks for
// foreign keys or referential integrity; FK constraints make iterating on the
// schema harder.
//
// Example:
//
// import { serial } from "drizzle-orm/pg-core"
//
// Business table
export const business = pgTable('business', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  taxId: text('taxId'),
  logo: text('logo'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Category table for inventory grouping
export const category = pgTable('category', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Product table for inventory
export const product = pgTable('product', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  categoryId: text('categoryId').references(() => category.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('costPrice', { precision: 10, scale: 2 }),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  unit: text('unit').notNull().default('pcs'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Customer table
export const customer = pgTable('customer', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  taxId: text('taxId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Invoice table
export const invoice = pgTable('invoice', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  customerId: text('customerId').references(() => customer.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoiceNumber').notNull(),
  invoiceDate: timestamp('invoiceDate').notNull(),
  dueDate: timestamp('dueDate'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal('taxRate', { precision: 5, scale: 2 }).default('0'),
  tax: decimal('tax', { precision: 12, scale: 2 }).default('0'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  paidAmount: decimal('paidAmount', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Invoice items
export const invoiceItem = pgTable('invoice_item', {
  id: text('id').primaryKey(),
  invoiceId: text('invoiceId').notNull().references(() => invoice.id, { onDelete: 'cascade' }),
  productId: text('productId').references(() => product.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').notNull().default('pcs'),
  unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Payment table
export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  invoiceId: text('invoiceId').notNull().references(() => invoice.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  method: text('method').notNull(),
  status: text('status').notNull().default('pending'),
  stripePaymentId: text('stripePaymentId'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Employee table
export const employee = pgTable('employee', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

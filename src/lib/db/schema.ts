import { pgTable, uuid, varchar, timestamp, pgEnum, numeric, integer, jsonb, index, boolean, check } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { cards } from './card-schema';

export const roleEnum = pgEnum('role', ['admin', 'vendedor']);
export const paymentTypeEnum = pgEnum('payment_type', ['efectivo', 'transferencia', 'debito', 'credito']);

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const providers = pgTable('providers', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }).notNull().default(''),
  email: varchar('email', { length: 100 }).notNull().default(''),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull().default(''),
  email: varchar('email', { length: 100 }).notNull().default(''),
  documentNumber: varchar('document_number', { length: 20 }).notNull().default('').unique(),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sales = pgTable(
  'sales',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id').references(() => customers.id),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => users.id),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    discountPercentage: numeric('discount_percentage', { precision: 5, scale: 2 }).default('0').notNull(),
    buyerName: varchar('buyer_name', { length: 60 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('sales_customer_id_idx').on(table.customerId), index('sales_vendor_id_idx').on(table.vendorId)]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 50 }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    detail: jsonb('detail'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('audit_logs_user_id_idx').on(table.userId), index('audit_logs_entity_idx').on(table.entity)]
);

export const salePayments = pgTable(
  'sale_payments',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id),
    type: paymentTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    cardId: uuid('card_id').references(() => cards.id),
    installments: integer('installments'),
    surchargePct: numeric('surcharge_pct', { precision: 5, scale: 2 }),
    surchargeAmount: numeric('surcharge_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sale_payments_sale_id_idx').on(table.saleId),
    index('sale_payments_card_id_idx').on(table.cardId),
    check(
      'sale_payments_card_check',
      sql`(${table.cardId} is null and ${table.installments} is null and ${table.surchargePct} is null and ${table.surchargeAmount} is null)
        or (${table.type}::text = 'credito' and ${table.cardId} is not null and ${table.installments} is not null and ${table.surchargePct} is not null and ${table.surchargeAmount} is not null
          and ${table.installments} in (1, 3, 6, 12) and ${table.surchargePct} >= 0 and ${table.surchargeAmount} >= 0)`
    ),
  ]
);

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  vendor: one(users, {
    fields: [sales.vendorId],
    references: [users.id],
  }),
  payments: many(salePayments),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  logs: many(auditLogs),
}));

export const providersRelations = relations(providers, ({ many }) => ({
  logs: many(auditLogs),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  logs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [auditLogs.entityId],
    references: [customers.id],
  }),
  provider: one(providers, {
    fields: [auditLogs.entityId],
    references: [providers.id],
  }),
  sale: one(sales, {
    fields: [auditLogs.entityId],
    references: [sales.id],
  }),
  targetUser: one(users, {
    fields: [auditLogs.entityId],
    references: [users.id],
  }),
}));

export const salePaymentsRelations = relations(salePayments, ({ one }) => ({
  sale: one(sales, {
    fields: [salePayments.saleId],
    references: [sales.id],
  }),
}));

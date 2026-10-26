import { sql } from 'drizzle-orm';
import { check, date, index, integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './schema';

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    invoiceNumber: varchar('invoice_number', { length: 30 }).notNull().unique('expenses_invoice_number_unique'),
    title: varchar('title', { length: 100 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    invoiceDate: date('invoice_date', { mode: 'string' }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('expenses_invoice_date_idx').on(table.invoiceDate), check('expenses_amount_check', sql`${table.amount} > 0`)]
);

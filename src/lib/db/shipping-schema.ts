import { sql } from 'drizzle-orm';
import { boolean, check, integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const shippingOptions = pgTable(
  'shipping_options',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar('title', { length: 60 }).notNull().unique('shipping_options_title_unique'),
    detail: varchar('detail', { length: 150 }).notNull().default(''),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [check('shipping_options_amount_check', sql`${table.amount} >= 0`)]
);

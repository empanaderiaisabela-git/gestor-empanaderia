import { sql } from 'drizzle-orm';
import { check, index, integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { menuItems } from './menu-schema';
import { providers, users } from './schema';

const money = (name: string) => numeric(name, { precision: 10, scale: 2 });

export const stockEntries = pgTable(
  'stock_entries',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    quantity: integer('quantity').notNull(),
    unitCost: money('unit_cost').notNull(),
    providerId: uuid('provider_id').references(() => providers.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('stock_entries_menu_item_id_idx').on(table.menuItemId),
    check('stock_entries_quantity_check', sql`${table.quantity} > 0`),
    check('stock_entries_unit_cost_check', sql`${table.unitCost} >= 0`),
  ]
);

export const stockLosses = pgTable(
  'stock_losses',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    quantity: numeric('quantity', { precision: 10, scale: 1 }).notNull(),
    unitCost: money('unit_cost').notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('stock_losses_menu_item_id_idx').on(table.menuItemId),
    check('stock_losses_quantity_check', sql`${table.quantity} > 0 and ${table.quantity} * 2 = trunc(${table.quantity} * 2)`),
    check('stock_losses_unit_cost_check', sql`${table.unitCost} >= 0`),
    check('stock_losses_reason_check', sql`length(trim(${table.reason})) > 0`),
  ]
);

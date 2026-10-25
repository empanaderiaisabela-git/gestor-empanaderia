import { sql } from 'drizzle-orm';
import { check, index, integer, numeric, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { menuGroupEnum, menuItems } from './menu-schema';
import { sales } from './schema';

const money = (name: string) => numeric(name, { precision: 10, scale: 2 });

export const saleLines = pgTable(
  'sale_lines',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    group: menuGroupEnum('menu_group').notNull(),
    presentationKey: varchar('presentation_key', { length: 10 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: money('unit_price').notNull(),
    subtotal: money('subtotal').notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    index('sale_lines_sale_id_idx').on(table.saleId),
    check('sale_lines_quantity_check', sql`${table.quantity} > 0`),
    check('sale_lines_unit_price_check', sql`${table.unitPrice} >= 0`),
    check('sale_lines_subtotal_check', sql`${table.subtotal} >= 0`),
    check('sale_lines_position_check', sql`${table.position} >= 0`),
  ]
);

export const saleLineItems = pgTable(
  'sale_line_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    saleLineId: uuid('sale_line_id')
      .notNull()
      .references(() => saleLines.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    units: numeric('units', { precision: 10, scale: 1 }).notNull(),
    unitCost: money('unit_cost').notNull(),
  },
  (table) => [
    index('sale_line_items_sale_line_id_idx').on(table.saleLineId),
    index('sale_line_items_menu_item_id_idx').on(table.menuItemId),
    check('sale_line_items_units_check', sql`${table.units} > 0`),
    check('sale_line_items_unit_cost_check', sql`${table.unitCost} >= 0`),
  ]
);

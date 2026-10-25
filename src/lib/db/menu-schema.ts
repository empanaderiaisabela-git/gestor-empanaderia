import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, numeric, pgEnum, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

export const menuGroupEnum = pgEnum('menu_group', ['empanadas', 'pizzas', 'sanguches', 'ciabattas', 'coca_cola', 'pepsi']);

const money = (name: string) => numeric(name, { precision: 10, scale: 2 });

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    group: menuGroupEnum('menu_group').notNull(),
    name: varchar('name', { length: 60 }).notNull(),
    unitCost: money('unit_cost').notNull(),
    stock: numeric('stock', { precision: 10, scale: 1 }).notNull().default('0'),
    price1: money('price_1'),
    price3: money('price_3'),
    price6: money('price_6'),
    price12: money('price_12'),
    isActive: boolean('is_active').default(true).notNull(),
    isVisible: boolean('is_visible').default(false).notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('menu_items_group_name_unique').on(table.group, table.name),
    check('menu_items_unit_cost_check', sql`${table.unitCost} >= 0`),
    check('menu_items_stock_check', sql`${table.stock} >= 0 and ${table.stock} * 2 = trunc(${table.stock} * 2)`),
    check('menu_items_whole_stock_check', sql`${table.group} = 'pizzas' or ${table.stock} = trunc(${table.stock})`),
    check(
      'menu_items_prices_check',
      sql`case
        when ${table.group} in ('empanadas', 'ciabattas')
          then ${table.price1} is null and ${table.price3} is null and ${table.price6} is null and ${table.price12} is null
        when ${table.group} = 'sanguches'
          then coalesce(${table.price1}, 0) > 0 and coalesce(${table.price3}, 0) > 0 and coalesce(${table.price6}, 0) > 0 and coalesce(${table.price12}, 0) > 0
        else coalesce(${table.price1}, 0) > 0 and ${table.price3} is null and ${table.price6} is null and ${table.price12} is null end`
    ),
  ]
);

export const menuGroupPrices = pgTable(
  'menu_group_prices',
  {
    group: menuGroupEnum('menu_group').primaryKey(),
    price1: money('price_1').notNull(),
    price3: money('price_3'),
    price6: money('price_6'),
    price12: money('price_12'),
    version: integer('version').default(1).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    check(
      'menu_group_prices_check',
      sql`case
        when ${table.group} = 'empanadas'
          then ${table.price1} > 0 and coalesce(${table.price3}, 0) > 0 and coalesce(${table.price6}, 0) > 0 and coalesce(${table.price12}, 0) > 0
        when ${table.group} = 'ciabattas'
          then ${table.price1} > 0 and ${table.price3} is null and ${table.price6} is null and ${table.price12} is null
        else false end`
    ),
  ]
);

export const menuItemImages = pgTable(
  'menu_item_images',
  {
    publicId: varchar('public_id', { length: 255 }).primaryKey(),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    url: varchar('url', { length: 500 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('menu_item_images_menu_item_id_idx').on(table.menuItemId)]
);

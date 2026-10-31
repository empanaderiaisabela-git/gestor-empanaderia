import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, numeric, pgEnum, pgTable, timestamp, unique, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

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
    unitCost: money('unit_cost'),
    stock: numeric('stock', { precision: 10, scale: 1 }).notNull().default('0'),
    price1: money('price_1'),
    price3: money('price_3'),
    price6: money('price_6'),
    price12: money('price_12'),
    isActive: boolean('is_active').default(true).notNull(),
    isVisible: boolean('is_visible').default(false).notNull(),
    isBase: boolean('is_base').default(false).notNull(),
    minStock: integer('min_stock'),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('menu_items_group_name_unique').on(table.group, table.name),
    uniqueIndex('menu_items_one_base_per_group').on(table.group).where(sql`${table.isBase}`),
    check('menu_items_unit_cost_check', sql`${table.unitCost} is null or ${table.unitCost} >= 0`),
    check('menu_items_min_stock_check', sql`${table.minStock} is null or ${table.minStock} between 1 and 100000`),
    check('menu_items_stock_check', sql`${table.stock} >= 0 and ${table.stock} * 2 = trunc(${table.stock} * 2)`),
    check('menu_items_whole_stock_check', sql`${table.group} = 'pizzas' or ${table.stock} = trunc(${table.stock})`),
    check(
      'menu_items_prices_check',
      sql`case
        when ${table.group} in ('empanadas', 'sanguches')
          then (${table.price1} is null and ${table.price3} is null and ${table.price6} is null and ${table.price12} is null)
            or (coalesce(${table.price1}, 0) > 0 and coalesce(${table.price3}, 0) > 0 and coalesce(${table.price6}, 0) > 0 and coalesce(${table.price12}, 0) > 0)
        else (${table.price1} is null or ${table.price1} > 0) and ${table.price3} is null and ${table.price6} is null and ${table.price12} is null end`
    ),
    check(
      'menu_items_base_check',
      sql`not ${table.isBase} or (${table.unitCost} is null and ${table.price1} is null and ${table.price3} is null and ${table.price6} is null and ${table.price12} is null
        and ${table.group} in ('pizzas', 'ciabattas') and ${table.stock} = trunc(${table.stock}))`
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

export const pizzaExtras = pgTable(
  'pizza_extras',
  {
    code: varchar('code', { length: 20 }).primaryKey(),
    price: money('price').notNull(),
    version: integer('version').default(1).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [check('pizza_extras_code_check', sql`${table.code} = 'jamon'`), check('pizza_extras_price_check', sql`${table.price} > 0`)]
);

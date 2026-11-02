import { sql } from 'drizzle-orm';
import { boolean, check, foreignKey, index, integer, numeric, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { menuGroupEnum, menuItems } from './menu-schema';

export const promotions = pgTable(
  'promotions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 60 }).notNull().unique('promotions_name_unique'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [check('promotions_price_check', sql`${table.price} > 0`)]
);

export const promotionComponents = pgTable(
  'promotion_components',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'cascade' }),
    group: menuGroupEnum('menu_group').notNull(),
    presentationKey: varchar('presentation_key', { length: 10 }).notNull(),
    quantity: integer('quantity').notNull(),
    position: integer('position').notNull().default(0),
    menuItemId: uuid('menu_item_id'),
  },
  (table) => [
    index('promotion_components_promotion_id_idx').on(table.promotionId),
    unique('promotion_components_unique').on(table.promotionId, table.group, table.presentationKey, table.menuItemId).nullsNotDistinct(),
    foreignKey({ name: 'promotion_components_menu_item_fk', columns: [table.menuItemId, table.group], foreignColumns: [menuItems.id, menuItems.group] }),
    check('promotion_components_menu_item_check', sql`${table.menuItemId} is null or ${table.group} in ('coca_cola', 'pepsi')`),
    check('promotion_components_quantity_check', sql`${table.quantity} > 0`),
    check('promotion_components_position_check', sql`${table.position} >= 0`),
    check(
      'promotion_components_presentation_check',
      sql`case
        when ${table.group} in ('empanadas', 'sanguches') then ${table.presentationKey} in ('u1', 'u3', 'u6', 'u12')
        when ${table.group} = 'pizzas' then ${table.presentationKey} in ('pizza_1', 'pizza_2')
        else ${table.presentationKey} = 'u1' end`
    ),
  ]
);

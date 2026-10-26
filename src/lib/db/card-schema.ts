import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, numeric, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

export const cards = pgTable('cards', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 40 }).notNull().unique('cards_name_unique'),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cardPlans = pgTable(
  'card_plans',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    installments: integer('installments').notNull(),
    surchargePct: numeric('surcharge_pct', { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [
    index('card_plans_card_id_idx').on(table.cardId),
    unique('card_plans_card_installments_unique').on(table.cardId, table.installments),
    check('card_plans_installments_check', sql`${table.installments} in (1, 3, 6, 12)`),
    check('card_plans_surcharge_check', sql`${table.surchargePct} >= 0 and ${table.surchargePct} <= 100`),
  ]
);

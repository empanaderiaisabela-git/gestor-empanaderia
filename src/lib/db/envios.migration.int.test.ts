import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { sales } from './schema';

const MIGRATION = readFileSync('src/lib/db/migrations/0032_envios.sql', 'utf8').split('--> statement-breakpoint');
const UNDO = ['ALTER TABLE "sales" DROP COLUMN "shipping_option_id"', 'ALTER TABLE "sales" DROP COLUMN "shipping_title"', 'ALTER TABLE "sales" DROP COLUMN "shipping_amount"', 'DROP TABLE "shipping_options"'];

describe('migración 0032: envíos (US-58 CA-1)', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
  });
  afterAll(async () => {
    await db.$client.end();
  });

  it('las ventas de hoy quedan sin envío y en $0, y los checks rechazan montos negativos y envíos sin título', async () => {
    const client = await db.$client.connect();
    const tx = drizzle(client);
    try {
      await client.query('BEGIN');
      for (const statement of UNDO) await client.query(statement);
      await client.query(`INSERT INTO "sales" ("vendor_id", "total") VALUES ('${TEST_USER_IDS.admin}', '1500.00')`);
      for (const statement of MIGRATION) await client.query(statement);
      expect(await tx.select({ total: sales.total, option: sales.shippingOptionId, title: sales.shippingTitle, amount: sales.shippingAmount }).from(sales)).toEqual([{ total: '1500.00', option: null, title: null, amount: '0.00' }]);
      const rejected = async (statement: string): Promise<string> => {
        await client.query('SAVEPOINT intento');
        const message = await client.query(statement).then(() => 'sin error', (error: Error) => error.message);
        await client.query('ROLLBACK TO SAVEPOINT intento');
        return message;
      };
      expect(await rejected(`INSERT INTO "shipping_options" ("title", "amount") VALUES ('Centro', -1)`)).toMatch(/shipping_options_amount_check/);
      const { rows } = await client.query(`INSERT INTO "shipping_options" ("title", "amount") VALUES ('Centro', 0) RETURNING "id"`);
      expect(await rejected(`UPDATE "sales" SET "shipping_option_id" = '${rows[0].id}'`)).toMatch(/sales_shipping_check/);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});

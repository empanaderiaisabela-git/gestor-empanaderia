import { readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';

const MIGRATION = readFileSync('src/lib/db/migrations/0033_numero-de-pedido.sql', 'utf8').split('--> statement-breakpoint');
const sale = (total: string): string => `INSERT INTO "sales" ("vendor_id", "total") VALUES ('${TEST_USER_IDS.admin}', '${total}')`;

describe('migración 0033: número de pedido (US-65 CA-1)', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
  });
  afterAll(async () => {
    await db.$client.end();
  });

  it('numera las ventas que ya existen y la venta nueva toma el número siguiente', async () => {
    const client = await db.$client.connect();
    try {
      await client.query('BEGIN');
      await client.query('ALTER TABLE "sales" DROP COLUMN "order_number"');
      await client.query(sale('100.00'));
      await client.query(sale('200.00'));
      for (const statement of MIGRATION) await client.query(statement);
      await client.query(sale('300.00'));
      const { rows } = await client.query('SELECT "total", "order_number" FROM "sales" ORDER BY "order_number"');
      expect(rows).toEqual([
        { total: '100.00', order_number: 1 },
        { total: '200.00', order_number: 2 },
        { total: '300.00', order_number: 3 },
      ]);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});

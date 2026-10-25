import { eq } from 'drizzle-orm';
import { pgSchema, serial, text } from 'drizzle-orm/pg-core';
import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import journal from '@/lib/db/migrations/meta/_journal.json';

const appliedMigrations = pgSchema('drizzle').table('__drizzle_migrations', {
  id: serial('id').primaryKey(),
  hash: text('hash'),
});

const installedExtensions = pgSchema('pg_catalog').table('pg_extension', {
  extname: text('extname'),
});

describe('db-test', () => {
  afterAll(async () => {
    await db.$client.end();
  });

  it('tiene aplicadas todas las migraciones del journal', async () => {
    const applied = await db.select({ id: appliedMigrations.id }).from(appliedMigrations);
    expect(applied).toHaveLength(journal.entries.length);
  });

  it('tiene habilitada la extensión unaccent', async () => {
    const found = await db.select({ extname: installedExtensions.extname }).from(installedExtensions).where(eq(installedExtensions.extname, 'unaccent'));
    expect(found).toEqual([{ extname: 'unaccent' }]);
  });
});

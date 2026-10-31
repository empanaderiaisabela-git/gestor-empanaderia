import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DIR = 'src/lib/db/migrations';
const FIRST_ADDITIVE = 23;
const FORBIDDEN = /\b(DROP|RENAME|ALTER TYPE|SET DATA TYPE|SET NOT NULL|TRUNCATE)\b|(?<!ON )\b(DELETE|UPDATE)\b/i;

const additive = readdirSync(DIR).filter((file) => file.endsWith('.sql') && Number(file.slice(0, 4)) >= FIRST_ADDITIVE);

describe('migraciones sólo aditivas desde la 0023 (US-45 CA-1, D-5)', () => {
  it('reconoce lo que borra, renombra o cambia datos, y deja pasar ON DELETE de una FK nueva', () => {
    ['DROP TABLE "x"', 'ALTER TABLE "x" RENAME COLUMN "a" TO "b"', 'ALTER TYPE "menu_group" ADD VALUE \'quilmes\'', 'UPDATE "x" SET "a" = 1', 'DELETE FROM "x"', 'ALTER COLUMN "a" SET NOT NULL'].forEach((statement) => expect(statement).toMatch(FORBIDDEN));
    expect('ALTER TABLE "x" ADD CONSTRAINT "f" FOREIGN KEY ("a") REFERENCES "y"("id") ON DELETE cascade ON UPDATE no action').not.toMatch(FORBIDDEN);
  });

  it.each(additive)('%s sólo agrega', (file) => {
    expect(readFileSync(`${DIR}/${file}`, 'utf8')).not.toMatch(FORBIDDEN);
  });

  it('las migraciones del sprint están en la lista', () => {
    expect(additive.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { RESET_STEPS } from './reset-steps';

describe('pasos de db:reset-full', () => {
  it('regression BUG-10: no genera migraciones nuevas en el repo', () => {
    expect(RESET_STEPS.map((step) => step.command).filter((command) => command.includes('generate'))).toEqual([]);
  });

  it('borra, migra y carga los datos, en ese orden', () => {
    expect(RESET_STEPS.map((step) => step.command)).toEqual([
      'npx tsx src/lib/db/scripts/wipe-db.ts',
      'npm run db:migrate',
      'npx tsx --conditions=react-server src/lib/db/scripts/setup-initial-data.ts',
    ]);
  });
});

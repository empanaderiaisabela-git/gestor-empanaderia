import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from './db-errors';
import { ConcurrencyError, DuplicateEntityError } from './errors';

const { DATABASE } = MESSAGES.ERROR;
const NOT_PRESENT = 'Key (provider_id)=(1) is not present in table "providers".';
const STILL_REFERENCED = 'Key (id)=(1) is still referenced from table "products".';

describe('handleDatabaseError', () => {
  it.each([
    { caso: 'un 23505 directo', error: { code: '23505' }, expected: DATABASE.UNIQUE_VIOLATION },
    { caso: 'un 23505 envuelto por Drizzle en cause', error: { message: 'Failed query: insert', cause: { code: '23505' } }, expected: DATABASE.UNIQUE_VIOLATION },
    { caso: 'un 23503 de referencia inexistente en cause', error: { message: 'Failed query: insert', cause: { code: '23503', detail: NOT_PRESENT } }, expected: DATABASE.RELATION_NOT_FOUND },
    { caso: 'un 23503 de registro todavía referenciado en cause', error: { message: 'Failed query: delete', cause: { code: '23503', detail: STILL_REFERENCED } }, expected: DATABASE.FOREIGN_KEY_VIOLATION },
    { caso: 'un 23503 en originalError', error: { originalError: { code: '23503', detail: NOT_PRESENT } }, expected: DATABASE.RELATION_NOT_FOUND },
    { caso: 'un error de consulta sin código', error: { message: 'Failed query: select' }, expected: DATABASE.CONCURRENCY },
    { caso: 'un ConcurrencyError', error: new ConcurrencyError(), expected: DATABASE.CONCURRENCY },
    { caso: 'un DuplicateEntityError', error: new DuplicateEntityError(), expected: DATABASE.UNIQUE_VIOLATION },
    { caso: 'un error con mensaje propio', error: new Error('Solo los administradores pueden realizar esta acción'), expected: 'Solo los administradores pueden realizar esta acción' },
    { caso: 'algo que no es un error', error: null, expected: DATABASE.GENERIC('Proveedor') },
  ])('traduce $caso', ({ error, expected }) => {
    expect(handleDatabaseError(error, 'Proveedor')).toBe(expected);
  });

  it('nunca lanza y siempre devuelve un mensaje, sea cual sea el error', () => {
    fc.assert(
      fc.property(fc.anything(), (error) => {
        const message = handleDatabaseError(error, 'Proveedor');
        expect(typeof message).toBe('string');
      })
    );
  });
});

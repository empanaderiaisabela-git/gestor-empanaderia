import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { databaseErrorCode, handleDatabaseError, toActionFailure } from './db-errors';
import { AppError, ConcurrencyError, DuplicateEntityError } from './errors';

const { DATABASE } = MESSAGES.ERROR;
const NOT_PRESENT = 'Key (provider_id)=(1) is not present in table "providers".';
const STILL_REFERENCED = 'Key (id)=(1) is still referenced from table "stock_entries".';

describe('handleDatabaseError', () => {
  it.each([
    { caso: 'un 23505 directo', error: { code: '23505' }, expected: DATABASE.UNIQUE_VIOLATION },
    { caso: 'un 23505 envuelto por Drizzle en cause', error: { message: 'Failed query: insert', cause: { code: '23505' } }, expected: DATABASE.UNIQUE_VIOLATION },
    { caso: 'un 23503 de referencia inexistente en cause', error: { message: 'Failed query: insert', cause: { code: '23503', detail: NOT_PRESENT } }, expected: DATABASE.RELATION_NOT_FOUND },
    { caso: 'un 23503 de registro todavía referenciado en cause', error: { message: 'Failed query: delete', cause: { code: '23503', detail: STILL_REFERENCED } }, expected: DATABASE.FOREIGN_KEY_VIOLATION },
    { caso: 'un 23503 en originalError', error: { originalError: { code: '23503', detail: NOT_PRESENT } }, expected: DATABASE.RELATION_NOT_FOUND },
    { caso: 'un error de consulta sin código (regresión BUG-14: no manda a sincronizar)', error: { message: 'Failed query: select' }, expected: DATABASE.GENERIC('Proveedor') },
    { caso: 'un ConcurrencyError', error: new ConcurrencyError(), expected: DATABASE.CONCURRENCY },
    { caso: 'un DuplicateEntityError', error: new DuplicateEntityError(), expected: DATABASE.UNIQUE_VIOLATION },
    { caso: 'un error con mensaje propio', error: new Error('Solo los administradores pueden realizar esta acción'), expected: 'Solo los administradores pueden realizar esta acción' },
    { caso: 'algo que no es un error', error: null, expected: DATABASE.GENERIC('Proveedor') },
  ])('traduce $caso', ({ error, expected }) => {
    expect(handleDatabaseError(error, 'Proveedor')).toBe(expected);
  });

  it('un AppError conserva su propio mensaje', () => {
    expect(handleDatabaseError(new AppError('NOT_FOUND', { entity: 'Usuario' }), 'Proveedor')).toBe(DATABASE.NOT_FOUND('Usuario'));
  });

  it.each([
    { caso: 'un AppError', error: new AppError('FORBIDDEN'), expected: 'FORBIDDEN' },
    { caso: 'un 23503 de registro referenciado', error: { cause: { code: '23503', detail: STILL_REFERENCED } }, expected: 'HAS_RELATIONS' },
    { caso: 'un ConcurrencyError', error: new ConcurrencyError(), expected: 'STALE_VERSION' },
    { caso: 'un error desconocido', error: new Error('x'), expected: null },
  ])('databaseErrorCode clasifica $caso', ({ error, expected }) => {
    expect(databaseErrorCode(error)).toBe(expected);
  });

  it.each([
    { caso: 'una tabla que no existe (base sin migrar)', error: { message: 'Failed query: select "menu_items"', cause: { code: '42P01', message: 'relation "menu_items" does not exist' } }, expected: 'UNEXPECTED' },
    { caso: 'la base caída', error: { message: 'Failed query: select 1', cause: { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:5433' } }, expected: 'UNEXPECTED' },
    { caso: 'un CHECK que falla', error: { message: 'Failed query: insert', cause: { code: '23514' } }, expected: 'VALIDATION' },
    { caso: 'un NOT NULL', error: { message: 'Failed query: insert', cause: { code: '23502' } }, expected: 'VALIDATION' },
    { caso: 'un número fuera de rango', error: { message: 'Failed query: insert', cause: { code: '22003' } }, expected: 'VALIDATION' },
    { caso: 'una versión vieja (AppError del service)', error: new AppError('STALE_VERSION'), expected: 'STALE_VERSION' },
  ])('regresión BUG-14: $caso → $expected', ({ error, expected }) => {
    expect(databaseErrorCode(error)).toBe(expected);
  });

  it('regresión BUG-14: una base sin migrar no muestra "sincroniza" ni el SQL, y deja el detalle en el log del servidor', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = { message: 'Failed query: select "menu_group_prices"', cause: { code: '42P01' } };
    const failure = toActionFailure(error, 'precios');
    expect(failure).toEqual({ success: false, code: 'UNEXPECTED', error: DATABASE.GENERIC('precios') });
    expect(handleDatabaseError(error, 'precios')).toBe(DATABASE.GENERIC('precios'));
    expect(log).toHaveBeenCalled();
  });

  it('toActionFailure arma el ActionResult de error con code', () => {
    expect(toActionFailure({ cause: { code: '23505' } }, 'Proveedor')).toEqual({ success: false, code: 'DUPLICATE', error: DATABASE.UNIQUE_VIOLATION });
  });

  it('toActionFailure no filtra al cliente el mensaje de un error desconocido', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(toActionFailure(new Error('detalle interno'), 'Proveedor')).toEqual({ success: false, code: 'UNEXPECTED', error: DATABASE.GENERIC('Proveedor') });
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

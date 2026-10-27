import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { AppError, ConcurrencyError, DuplicateEntityError, errorMessage, isAppError } from '.';

const { VALIDATION, DATABASE } = MESSAGES.ERROR;

describe('catálogo de errores (T-4 CA-1)', () => {
  it.each([
    { code: 'VALIDATION', message: VALIDATION.INVALID_DATA },
    { code: 'UNAUTHENTICATED', message: 'No autorizado (Token faltante)' },
    { code: 'SESSION_EXPIRED', message: 'El token es inválido o ha expirado' },
    { code: 'INACTIVE_USER', message: 'Sesión inválida o usuario desactivado. Por favor, cierre sesión y vuelva a entrar.' },
    { code: 'FORBIDDEN', message: 'Solo los administradores pueden realizar esta acción' },
    { code: 'NOT_FOUND', message: DATABASE.NOT_FOUND('el proveedor') },
    { code: 'DUPLICATE', message: DATABASE.UNIQUE_VIOLATION },
    { code: 'HAS_RELATIONS', message: DATABASE.FOREIGN_KEY_VIOLATION },
    { code: 'RELATION_NOT_FOUND', message: DATABASE.RELATION_NOT_FOUND },
    { code: 'STALE_VERSION', message: DATABASE.CONCURRENCY },
    { code: 'UNEXPECTED', message: DATABASE.GENERIC('el proveedor') },
  ] as const)('$code usa el mismo texto que ve hoy el usuario', ({ code, message }) => {
    expect(errorMessage(code, 'el proveedor')).toBe(message);
  });

  it('INSUFFICIENT_STOCK nombra el gusto que no alcanza (US-4)', () => {
    expect(errorMessage('INSUFFICIENT_STOCK', 'Carne suave')).toBe('No hay stock suficiente de Carne suave.');
    expect(new AppError('INSUFFICIENT_STOCK', { entity: 'Muzza' })).toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Muzza.' });
  });

  it('sin entidad usa "el registro" en los mensajes que la nombran (BUG-19)', () => {
    expect(errorMessage('NOT_FOUND')).toBe('El registro ya no existe.');
  });
});

describe('AppError', () => {
  it('lleva el código, el mensaje del catálogo y la causa', () => {
    const cause = new Error('original');
    const error = new AppError('NOT_FOUND', { entity: 'el usuario', cause });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'AppError', code: 'NOT_FOUND', message: DATABASE.NOT_FOUND('el usuario'), cause });
  });

  it('isAppError distingue un AppError de cualquier otro error', () => {
    expect(isAppError(new AppError('FORBIDDEN'))).toBe(true);
    expect(isAppError(new Error('otro'))).toBe(false);
    expect(isAppError('texto')).toBe(false);
  });
});

describe('errores heredados', () => {
  it('se siguen importando desde @/lib/errors con sus nombres y textos', () => {
    expect(new ConcurrencyError()).toMatchObject({ name: 'ConcurrencyError', message: 'La entidad fue modificada por otro usuario o proceso. Por favor, recarga los datos e intenta nuevamente.' });
    expect(new DuplicateEntityError()).toMatchObject({ name: 'DuplicateEntityError', message: 'Ya existe un registro con esos datos.' });
  });
});

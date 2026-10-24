import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { type ActionResult, fail } from './action-result';

describe('ActionResult (T-4 CA-2)', () => {
  it('fail arma el caso de error con code y con el mensaje del catálogo en error', () => {
    expect(fail('DUPLICATE')).toEqual({ success: false, code: 'DUPLICATE', error: MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION });
  });

  it('fail usa la entidad en los mensajes que la nombran', () => {
    expect(fail('NOT_FOUND', 'Proveedor')).toEqual({ success: false, code: 'NOT_FOUND', error: MESSAGES.ERROR.DATABASE.NOT_FOUND('Proveedor') });
  });

  it('el caso de error heredado, sin code, sigue siendo un ActionResult válido', () => {
    const legacy: ActionResult = { success: false, error: 'Mensaje heredado' };
    expect(legacy.success).toBe(false);
  });
});

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hamPriceRowSchema, hamPriceSchema } from './pizza-extra.schema';

describe('precio del jamón extra (US-47 CA-2)', () => {
  it('acepta un precio mayor a 0 con la versión que se leyó; 0 es "todavía sin precio"', () => {
    expect(hamPriceSchema.parse({ price: 1500, version: 0 })).toEqual({ price: 1500, version: 0 });
    expect(hamPriceSchema.safeParse({ price: 0, version: 1 }).error?.issues[0].message).toBe('El precio debe ser mayor a 0');
    expect(hamPriceSchema.safeParse({ price: 1500 }).success).toBe(false);
    expect(hamPriceSchema.safeParse({ price: 1500, version: 1, code: 'x' }).success).toBe(false);
  });

  it('la fila convierte el precio de Postgres y nunca lanza (fuzz)', () => {
    expect(hamPriceRowSchema.parse({ price: '1500.00', version: 2 })).toEqual({ price: 1500, version: 2 });
    fc.assert(fc.property(fc.anything(), (input) => typeof hamPriceSchema.safeParse(input).success === 'boolean'));
  });
});

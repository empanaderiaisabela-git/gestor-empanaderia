import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { stockLevel } from './stock-level';

describe('color del stock según el mínimo (US-45 CA-3, P-4)', () => {
  it.each([
    { caso: 'sin stock es rojo aunque haya mínimo', stock: 0, minStock: 5, level: 'empty' },
    { caso: 'por debajo del mínimo es amarillo', stock: 4, minStock: 5, level: 'low' },
    { caso: 'en el mínimo es verde', stock: 5, minStock: 5, level: 'ok' },
    { caso: 'sin mínimo es verde', stock: 1, minStock: null, level: 'ok' },
    { caso: 'sin mínimo y sin stock es rojo', stock: 0, minStock: null, level: 'empty' },
  ] as const)('$caso', ({ stock, minStock, level }) => {
    expect(stockLevel({ stock, minStock })).toBe(level);
  });

  it('amarillo sólo cuando hay stock y es menor al mínimo (fuzz)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.option(fc.integer({ min: 1, max: 1000 })), (stock, minStock) => {
        const low = stock > 0 && minStock !== null && stock < minStock;
        expect(stockLevel({ stock, minStock }) === 'low').toBe(low);
      })
    );
  });
});

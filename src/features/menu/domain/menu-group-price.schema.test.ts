import { describe, expect, it } from 'vitest';
import { menuGroupPriceRowSchema } from './menu-group-price.schema';

describe('precios del grupo', () => {
  it('la fila convierte los importes a número', () => {
    const row = { group: 'ciabattas', price1: '6000.00', price3: null, price6: null, price12: null, version: 2, updatedAt: new Date(0) };
    expect(menuGroupPriceRowSchema.parse(row)).toMatchObject({ price1: 6000, price3: null, version: 2 });
  });
});

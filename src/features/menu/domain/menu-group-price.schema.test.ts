import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { menuGroupPriceRowSchema, menuGroupPricesSchema } from './menu-group-price.schema';

const EMPANADAS = { group: 'empanadas', prices: { price1: 1200, price3: 3400, price6: 6500, price12: 12000 }, version: 0 };
const CIABATTAS = { group: 'ciabattas', prices: { price1: 6000 }, version: 3 };

function messages(input: unknown): string[] {
  const result = menuGroupPricesSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('precios del grupo (US-3 CA-7)', () => {
  it('acepta las empanadas con sus cuatro precios y las ciabattas con el de la unidad', () => {
    expect(menuGroupPricesSchema.parse(EMPANADAS)).toEqual(EMPANADAS);
    expect(menuGroupPricesSchema.parse(CIABATTAS)).toEqual(CIABATTAS);
  });

  it.each([
    { caso: 'un grupo con precio por gusto', input: { ...CIABATTAS, group: 'pizzas' }, message: 'Este grupo no tiene precio único' },
    { caso: 'empanadas sin la docena', input: { ...EMPANADAS, prices: { price1: 1, price3: 3, price6: 6 } }, message: 'Falta el precio de 1 docena' },
    { caso: 'ciabattas con precio de 3', input: { ...CIABATTAS, prices: { price1: 1, price3: 3 } }, message: 'Este grupo no se vende en esa presentación' },
    { caso: 'precio negativo', input: { ...CIABATTAS, prices: { price1: -5 } }, message: 'El precio debe ser mayor a 0' },
  ])('rechaza $caso', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });

  it('la versión 0 significa "todavía no tiene precio"; no admite negativas', () => {
    expect(messages({ ...CIABATTAS, version: 0 })).toEqual([]);
    expect(menuGroupPricesSchema.safeParse({ ...CIABATTAS, version: -1 }).success).toBe(false);
  });

  it('la fila convierte los importes a número', () => {
    const row = { group: 'ciabattas', price1: '6000.00', price3: null, price6: null, price12: null, version: 2, updatedAt: new Date(0) };
    expect(menuGroupPriceRowSchema.parse(row)).toMatchObject({ price1: 6000, price3: null, version: 2 });
  });

  it('fuzz: ninguna entrada arbitraria hace lanzar al schema', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof menuGroupPricesSchema.safeParse(input).success === 'boolean'));
  });
});

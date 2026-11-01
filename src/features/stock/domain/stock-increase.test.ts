import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { increased, increaseRowsOf, priceIncreaseSchema } from './stock-increase';

const ID = '11111111-1111-4111-8111-111111111111';
const first = (input: unknown): string | undefined => priceIncreaseSchema.safeParse(input).error?.issues[0]?.message;
const item = (id: string, name: string, extra: Partial<MenuItemDef> = {}): MenuItemDef => ({ id, group: 'coca_cola', name, unitCost: 900, stock: 1, price1: 2500, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 1, createdAt: '', updatedAt: '', ...extra });

describe('registrar aumento (US-50 CA-2)', () => {
  it('aumenta al centavo, sin redondeo', () => {
    expect([increased(2750, 10), increased(1000, 7.5), increased(999.99, 33.33)]).toEqual([3025, 1075, 1333.29]);
  });

  it('acepta un solo porcentaje, pero no ninguno', () => {
    expect(priceIncreaseSchema.parse({ menuItemIds: [ID], costPercent: null, pricePercent: 10 })).toEqual({ menuItemIds: [ID], costPercent: null, pricePercent: 10 });
    expect(first({ menuItemIds: [ID], costPercent: null, pricePercent: null })).toBe('Cargá al menos un porcentaje');
  });

  it.each([
    { caso: 'ningún producto', input: { menuItemIds: [], costPercent: 10, pricePercent: null }, mensaje: 'Elegí al menos un producto' },
    { caso: 'porcentaje 0', input: { menuItemIds: [ID], costPercent: 0, pricePercent: null }, mensaje: 'El porcentaje debe ser mayor a 0' },
    { caso: 'porcentaje de más', input: { menuItemIds: [ID], costPercent: 501, pricePercent: null }, mensaje: 'El porcentaje no puede superar el 500 %' },
    { caso: 'tres decimales', input: { menuItemIds: [ID], costPercent: 1.234, pricePercent: null }, mensaje: 'Hasta 2 decimales' },
  ])('rechaza $caso con el mensaje exacto', ({ input, mensaje }) => {
    expect(first(input)).toBe(mensaje);
  });

  it('rechaza campos de más y nunca lanza (fuzz)', () => {
    expect(priceIncreaseSchema.safeParse({ menuItemIds: [ID], costPercent: 1, pricePercent: null, all: true }).success).toBe(false);
    fc.assert(fc.property(fc.anything(), (input) => typeof priceIncreaseSchema.safeParse(input).success === 'boolean'));
  });

  it('una fila por producto y una por familia de bebidas, con bebida y litros exactos (US-51)', () => {
    const aquarius = { drinkName: 'Aquarius', drinkSize: '1.5L' };
    const items = [item('a', 'Aquarius 1.5L Manzana', aquarius), item('b', 'Sprite 1,5 L'), item('c', 'Aquarius 1.5L Pera', aquarius), item('d', 'aquarius 1.5L Uva', { ...aquarius, drinkName: 'aquarius' })];
    expect(increaseRowsOf(items)).toEqual([
      { key: 'a', label: 'Aquarius 1.5L (2 sabores)', ids: ['a', 'c'] },
      { key: 'b', label: 'Sprite 1,5 L', ids: ['b'] },
      { key: 'd', label: 'aquarius 1.5L Uva', ids: ['d'] },
    ]);
  });
});

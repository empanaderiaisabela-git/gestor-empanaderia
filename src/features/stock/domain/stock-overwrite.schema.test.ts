import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { stockOverwriteSchema } from './stock.schema';

const ITEM = '11111111-1111-4111-8111-111111111111';
const ENTRY = { id: '22222222-2222-4222-8222-222222222222', version: 3 };
const VALID = { menuItemId: ITEM, itemVersion: 4, stock: 17, entry: ENTRY };
const messageOf = (input: unknown): string | undefined => stockOverwriteSchema.safeParse(input).error?.issues[0].message;

describe('pisar el stock con el lápiz (US-70 CA-1)', () => {
  it('acepta el stock final de 0 a 100.000, con o sin ingreso', () => {
    expect(stockOverwriteSchema.parse(VALID)).toEqual(VALID);
    expect(stockOverwriteSchema.parse({ ...VALID, stock: 0, entry: null, unitCost: 800, minStock: null })).toMatchObject({ stock: 0, entry: null });
    expect(stockOverwriteSchema.safeParse({ ...VALID, stock: 100_000 }).success).toBe(true);
  });

  it('rechaza un stock negativo, con decimales, vacío o enorme con su mensaje', () => {
    expect(messageOf({ ...VALID, stock: -1 })).toBe('El stock no puede ser negativo');
    expect(messageOf({ ...VALID, stock: 1.5 })).toBe('El stock tiene que ser un número entero');
    expect(messageOf({ ...VALID, stock: Number.NaN })).toBe('Ingresá el stock');
    expect(messageOf({ ...VALID, stock: 100_001 })).toBe('El stock es demasiado grande');
  });

  it('pide la versión del gusto y el ingreso (o null), sin campos de más', () => {
    expect(stockOverwriteSchema.safeParse({ ...VALID, itemVersion: undefined }).success).toBe(false);
    expect(stockOverwriteSchema.safeParse({ ...VALID, entry: undefined }).success).toBe(false);
    expect(stockOverwriteSchema.safeParse({ ...VALID, quantity: 5 }).success).toBe(false);
    expect(stockOverwriteSchema.safeParse({ ...VALID, entry: { ...ENTRY, quantity: 5 } }).success).toBe(false);
  });

  it('nunca lanza (fuzz)', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof stockOverwriteSchema.safeParse(input).success === 'boolean'));
  });
});

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { stockEntryRowSchema, stockEntrySchema, stockLossSchema } from './stock.schema';

const ITEM = '11111111-1111-4111-8111-111111111111';
const first = (result: { success: boolean; error?: { issues: { message: string }[] } }): string | undefined => result.error?.issues[0]?.message;

describe('ingresar stock (US-4 CA-2)', () => {
  it('acepta cantidad entera, costo y proveedor opcionales', () => {
    expect(stockEntrySchema.parse({ menuItemId: ITEM, quantity: 24 })).toEqual({ menuItemId: ITEM, quantity: 24 });
    expect(stockEntrySchema.parse({ menuItemId: ITEM, quantity: 6, unitCost: 450.5, providerId: null })).toMatchObject({ unitCost: 450.5, providerId: null });
  });

  it('acepta los precios de venta (US-17) y rechaza uno en 0', () => {
    expect(stockEntrySchema.parse({ menuItemId: ITEM, quantity: 6, prices: { price1: 11000 } })).toMatchObject({ prices: { price1: 11000 } });
    expect(first(stockEntrySchema.safeParse({ menuItemId: ITEM, quantity: 6, prices: { price1: 0 } }))).toBe('El precio debe ser mayor a 0');
    expect(stockEntrySchema.safeParse({ menuItemId: ITEM, quantity: 6, prices: { price1: 1, price2: 2 } }).success).toBe(false);
  });

  it.each([
    { caso: 'cantidad 0', input: { menuItemId: ITEM, quantity: 0 }, message: 'La cantidad debe ser mayor a 0' },
    { caso: 'cantidad con decimales', input: { menuItemId: ITEM, quantity: 1.5 }, message: 'La cantidad tiene que ser un número entero' },
    { caso: 'cantidad enorme', input: { menuItemId: ITEM, quantity: 100_001 }, message: 'La cantidad es demasiado grande' },
    { caso: 'costo negativo', input: { menuItemId: ITEM, quantity: 1, unitCost: -1 }, message: 'El costo no puede ser negativo' },
    { caso: 'sin gusto', input: { menuItemId: 'x', quantity: 1 }, message: 'Elegí un gusto o bebida' },
    { caso: 'proveedor inválido', input: { menuItemId: ITEM, quantity: 1, providerId: 'x' }, message: 'Elegí un proveedor válido' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(first(stockEntrySchema.safeParse(input))).toBe(message);
  });

  it('rechaza campos de más (strictObject) y nunca lanza (fuzz)', () => {
    expect(stockEntrySchema.safeParse({ menuItemId: ITEM, quantity: 1, stock: 99 }).success).toBe(false);
    fc.assert(fc.property(fc.anything(), (input) => typeof stockEntrySchema.safeParse(input).success === 'boolean'));
  });
});

describe('registrar una merma (US-4 CA-4)', () => {
  it('acepta unidades enteras o media pizza, con motivo', () => {
    expect(stockLossSchema.parse({ menuItemId: ITEM, quantity: 0.5, reason: '  Se quemó  ' })).toEqual({ menuItemId: ITEM, quantity: 0.5, reason: 'Se quemó' });
  });

  it.each([
    { caso: 'cantidad 0', input: { menuItemId: ITEM, quantity: 0, reason: 'x' }, message: 'La cantidad debe ser mayor a 0' },
    { caso: 'un tercio', input: { menuItemId: ITEM, quantity: 0.3, reason: 'x' }, message: 'La cantidad va de a una unidad (o media pizza)' },
    { caso: 'sin motivo', input: { menuItemId: ITEM, quantity: 1, reason: '   ' }, message: 'Debe especificar un motivo' },
    { caso: 'motivo de 256', input: { menuItemId: ITEM, quantity: 1, reason: 'a'.repeat(256) }, message: 'El motivo es demasiado largo' },
  ])('rechaza $caso', ({ input, message }) => {
    expect(first(stockLossSchema.safeParse(input))).toBe(message);
  });

  it('nunca lanza (fuzz)', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof stockLossSchema.safeParse(input).success === 'boolean'));
  });
});

describe('fila del historial', () => {
  it('convierte el costo y admite que venga oculto', () => {
    const row = { id: ITEM, menuItemId: ITEM, quantity: 12, unitCost: '450.00', providerName: null, username: 'admin', createdAt: new Date(0) };
    expect(stockEntryRowSchema.parse(row)).toMatchObject({ unitCost: 450 });
    expect(stockEntryRowSchema.parse({ ...row, unitCost: null })).toMatchObject({ unitCost: null });
  });
});

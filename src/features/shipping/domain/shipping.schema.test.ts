import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { shippingCreateSchema, shippingDeleteSchema, shippingRowSchema, shippingToggleSchema, shippingUpdateSchema } from './shipping.schema';

const SHIPPING = { title: 'Centro', detail: 'Barrio A hasta Barrio B', amount: 1500 };
const ID = '11111111-1111-4111-8111-111111111111';

function messages(input: unknown): string[] {
  const result = shippingCreateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('shippingCreateSchema (US-58 CA-3)', () => {
  it('acepta título, detalle y monto, sin espacios de más', () => {
    expect(shippingCreateSchema.parse({ title: ' Centro ', detail: ' Barrio A hasta Barrio B ', amount: 1500 })).toEqual(SHIPPING);
  });

  it('acepta los límites: título de 60, detalle vacío o de 150, monto $0 y con 2 decimales (D-6)', () => {
    expect(messages({ title: 'T'.repeat(60), detail: '', amount: 0 })).toEqual([]);
    expect(messages({ ...SHIPPING, detail: 'D'.repeat(150), amount: 1500.55 })).toEqual([]);
  });

  it.each([
    { caso: 'título vacío', input: { ...SHIPPING, title: ' ' }, message: 'El título es obligatorio' },
    { caso: 'sin título', input: { detail: '', amount: 1 }, message: 'El título es obligatorio' },
    { caso: 'título de 61', input: { ...SHIPPING, title: 'T'.repeat(61) }, message: 'El título no puede superar los 60 caracteres' },
    { caso: 'detalle de 151', input: { ...SHIPPING, detail: 'D'.repeat(151) }, message: 'El detalle no puede superar los 150 caracteres' },
    { caso: 'monto negativo', input: { ...SHIPPING, amount: -0.01 }, message: 'El monto no puede ser negativo' },
    { caso: 'monto demasiado alto', input: { ...SHIPPING, amount: 10_000_000 }, message: 'El monto es demasiado alto' },
    { caso: 'monto con 3 decimales', input: { ...SHIPPING, amount: 1.555 }, message: 'Máximo 2 decimales' },
    { caso: 'monto que no es un número', input: { ...SHIPPING, amount: '1500' }, message: 'Ingresá un monto válido' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });

  it('rechaza campos de más (strictObject) y aguanta cualquier entrada (fuzz)', () => {
    expect(shippingCreateSchema.safeParse({ ...SHIPPING, isActive: false }).success).toBe(false);
    fc.assert(fc.property(fc.anything(), (input) => typeof shippingCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('schemas de edición, activación, borrado y fila', () => {
  it('editar pide todo de nuevo más la versión; activar y borrar, un id válido y la versión', () => {
    expect(shippingUpdateSchema.safeParse({ ...SHIPPING, version: 1 }).success).toBe(true);
    expect(shippingUpdateSchema.safeParse(SHIPPING).success).toBe(false);
    expect(shippingToggleSchema.safeParse({ id: ID, isActive: false, version: 1 }).success).toBe(true);
    expect(shippingDeleteSchema.safeParse({ id: 'x', version: 1 }).success).toBe(false);
  });

  it('la fila convierte el monto de la base en número', () => {
    const row = { id: ID, ...SHIPPING, amount: '1500.00', isActive: true, version: 1, createdAt: new Date(0), updatedAt: '2026-11-03T00:00:00Z' };
    expect(shippingRowSchema.parse(row)).toMatchObject({ amount: 1500, version: 1 });
  });
});

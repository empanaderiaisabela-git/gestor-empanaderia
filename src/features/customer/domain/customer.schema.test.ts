import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { customerCreateSchema, customerUpdateSchema } from './customer.schema';

const VALID = { name: 'Juana Pérez', phone: '+54 9 11 5555-0000', email: 'juana@correo.com', documentNumber: '35.123.456' };

function firstMessage(input: unknown): string | undefined {
  const result = customerCreateSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('customerCreateSchema', () => {
  it('acepta un cliente completo y recorta espacios', () => {
    expect(customerCreateSchema.parse({ ...VALID, name: '  Juana Pérez  ' })).toEqual(VALID);
  });

  it('sólo el nombre es obligatorio: teléfono, correo y DNI vacíos o con espacios quedan en blanco (US-26)', () => {
    expect(customerCreateSchema.parse({ name: 'Juana', phone: '  ', email: '', documentNumber: ' ' })).toEqual({ name: 'Juana', phone: '', email: '', documentNumber: '' });
  });

  it.each([
    { caso: 'nombre vacío', input: { ...VALID, name: '' }, message: 'El nombre debe tener al menos 2 caracteres' },
    { caso: 'nombre de 101 caracteres', input: { ...VALID, name: 'A'.repeat(101) }, message: 'Nombre demasiado largo' },
    { caso: 'teléfono con letras', input: { ...VALID, phone: 'abc' }, message: 'Formato de teléfono inválido (solo números, +, - y espacios)' },
    { caso: 'teléfono de 31 caracteres', input: { ...VALID, phone: '1'.repeat(31) }, message: 'Número de teléfono demasiado largo' },
    { caso: 'correo inválido', input: { ...VALID, email: 'no-es-un-correo' }, message: 'Formato de correo electrónico inválido' },
    { caso: 'correo de 101 caracteres', input: { ...VALID, email: `${'a'.repeat(90)}@correo.com` }, message: 'El correo electrónico es demasiado largo' },
    { caso: 'DNI de 21 caracteres', input: { ...VALID, documentNumber: '1'.repeat(21) }, message: 'Documento demasiado largo' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(firstMessage(input)).toBe(message);
  });

  it('acepta los límites: nombre de 2 y de 100, teléfono de 30 y DNI de 20', () => {
    expect(firstMessage({ ...VALID, name: 'AB' })).toBeUndefined();
    expect(firstMessage({ ...VALID, name: 'A'.repeat(100), phone: '1'.repeat(30), documentNumber: '1'.repeat(20) })).toBeUndefined();
  });

  it('rechaza campos de más (strictObject)', () => {
    expect(customerCreateSchema.safeParse({ ...VALID, isActive: false }).success).toBe(false);
  });

  it('ninguna entrada arbitraria hace lanzar al schema', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof customerCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('customerUpdateSchema', () => {
  it('exige la versión y acepta cambios parciales, también borrar el DNI', () => {
    expect(customerUpdateSchema.parse({ documentNumber: '', version: 2 })).toEqual({ documentNumber: '', version: 2 });
    expect(customerUpdateSchema.safeParse({ documentNumber: '' }).success).toBe(false);
  });
});

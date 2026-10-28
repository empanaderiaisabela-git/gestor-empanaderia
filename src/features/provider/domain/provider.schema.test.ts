import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { providerCreateSchema, providerDeleteSchema, providerToggleSchema, providerUpdateSchema } from './provider.schema';

const VALID = { name: 'Molino del Sur', phone: '+54 9 11 5555-0000', email: 'ventas@molino.com' };
const ID = '11111111-1111-4111-8111-111111111111';

function firstMessage(input: unknown): string | undefined {
  const result = providerCreateSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('providerCreateSchema', () => {
  it('acepta un proveedor válido y recorta espacios', () => {
    expect(providerCreateSchema.parse({ ...VALID, name: '  Molino del Sur  ' })).toEqual(VALID);
  });

  it.each([
    { caso: 'nombre de 1 carácter', input: { ...VALID, name: 'A' }, message: 'El nombre debe tener al menos 2 caracteres' },
    { caso: 'nombre de 101 caracteres', input: { ...VALID, name: 'A'.repeat(101) }, message: 'Nombre demasiado largo' },
    { caso: 'teléfono de 31 caracteres', input: { ...VALID, phone: '1'.repeat(31) }, message: 'Número de teléfono demasiado largo' },
    { caso: 'correo inválido', input: { ...VALID, email: 'no-es-un-correo' }, message: 'Formato de correo electrónico inválido' },
    { caso: 'correo de 101 caracteres', input: { ...VALID, email: `${'a'.repeat(90)}@molino.com` }, message: 'El correo electrónico es demasiado largo' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(firstMessage(input)).toBe(message);
  });

  it('el teléfono y el correo son opcionales: vacíos o con espacios quedan en blanco (US-25)', () => {
    expect(providerCreateSchema.parse({ name: 'Molino del Sur', phone: '   ', email: '' })).toEqual({ name: 'Molino del Sur', phone: '', email: '' });
  });

  it('acepta los límites: nombre de 2 y de 100, teléfono de 30', () => {
    expect(firstMessage({ ...VALID, name: 'AB' })).toBeUndefined();
    expect(firstMessage({ ...VALID, name: 'A'.repeat(100), phone: '1'.repeat(30) })).toBeUndefined();
  });

  it('rechaza campos de más (strictObject)', () => {
    expect(providerCreateSchema.safeParse({ ...VALID, isActive: false }).success).toBe(false);
  });

  it('ninguna entrada arbitraria hace lanzar al schema', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof providerCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('schemas de edición, activación y borrado', () => {
  it('editar exige la versión y acepta cambios parciales', () => {
    expect(providerUpdateSchema.parse({ phone: '1234', version: 2 })).toEqual({ phone: '1234', version: 2 });
    expect(providerUpdateSchema.safeParse({ phone: '1234' }).success).toBe(false);
  });

  it('activar o desactivar exige id, estado y versión', () => {
    expect(providerToggleSchema.parse({ id: ID, isActive: false, version: 1 })).toEqual({ id: ID, isActive: false, version: 1 });
    expect(providerToggleSchema.safeParse({ id: 'x', isActive: false, version: 1 }).success).toBe(false);
  });

  it('borrar exige id y una versión de al menos 1', () => {
    expect(providerDeleteSchema.safeParse({ id: ID, version: 1 }).success).toBe(true);
    expect(providerDeleteSchema.safeParse({ id: ID, version: 0 }).success).toBe(false);
  });
});

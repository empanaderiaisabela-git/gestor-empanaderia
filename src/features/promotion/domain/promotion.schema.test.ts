import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { promotionCreateSchema, promotionDeleteSchema, promotionRowSchema, promotionToggleSchema, promotionUpdateSchema } from './promotion.schema';

const DOCENA = { group: 'empanadas', presentationKey: 'u12', quantity: 1 };
const COCA = { group: 'coca_cola', presentationKey: 'u1', quantity: 2 };
const PROMO = { name: 'Docena + 2 Coca', price: 15000, components: [DOCENA, COCA] };
const ID = '11111111-1111-4111-8111-111111111111';

function messages(input: unknown): string[] {
  const result = promotionCreateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('promotionCreateSchema (US-8 CA-1 y CA-2)', () => {
  it('acepta una promo con componentes de distintos grupos y el precio escrito a mano', () => {
    expect(promotionCreateSchema.parse({ ...PROMO, name: '  Docena + 2 Coca  ' })).toEqual(PROMO);
  });

  it('acepta una pizza de 2 sabores como componente', () => {
    expect(messages({ ...PROMO, components: [{ group: 'pizzas', presentationKey: 'pizza_2', quantity: 1 }] })).toEqual([]);
  });

  it.each([
    { caso: 'sin componentes', input: { ...PROMO, components: [] }, message: 'Agregá al menos un producto' },
    { caso: 'precio 0', input: { ...PROMO, price: 0 }, message: 'El precio debe ser mayor a 0' },
    { caso: 'precio con 3 decimales', input: { ...PROMO, price: 10.555 }, message: 'Máximo 2 decimales' },
    { caso: 'nombre vacío', input: { ...PROMO, name: '  ' }, message: 'El nombre es obligatorio' },
    { caso: 'nombre de 61 caracteres', input: { ...PROMO, name: 'A'.repeat(61) }, message: 'El nombre no puede superar los 60 caracteres' },
    { caso: 'presentación que no es del grupo', input: { ...PROMO, components: [{ ...DOCENA, presentationKey: 'pizza_1' }] }, message: 'Ese grupo no se vende en esa presentación' },
    { caso: 'el mismo producto dos veces', input: { ...PROMO, components: [DOCENA, DOCENA] }, message: 'Ese producto ya está en la promo: sumá la cantidad' },
    { caso: 'cantidad 0', input: { ...PROMO, components: [{ ...DOCENA, quantity: 0 }] }, message: 'La cantidad debe ser al menos 1' },
    { caso: 'cantidad con decimales', input: { ...PROMO, components: [{ ...DOCENA, quantity: 1.5 }] }, message: 'La cantidad debe ser un número entero' },
    { caso: 'cantidad de 100', input: { ...PROMO, components: [{ ...DOCENA, quantity: 100 }] }, message: 'La cantidad no puede superar 99' },
    { caso: 'grupo inexistente', input: { ...PROMO, components: [{ ...DOCENA, group: 'tartas' }] }, message: 'Elegí un grupo válido' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });

  it('acepta los límites: nombre de 60, cantidad 99 y 10 componentes; rechaza 11', () => {
    const ten = ['u1', 'u3', 'u6', 'u12'].flatMap((key) => [{ group: 'empanadas', presentationKey: key, quantity: 1 }, { group: 'sanguches', presentationKey: key, quantity: 1 }]);
    const many = [...ten, { group: 'pepsi', presentationKey: 'u1', quantity: 99 }, COCA];
    expect(messages({ ...PROMO, name: 'A'.repeat(60), components: many })).toEqual([]);
    expect(messages({ ...PROMO, components: [...many, { group: 'ciabattas', presentationKey: 'u1', quantity: 1 }] })).toContain('Una promo puede tener hasta 10 productos');
  });

  it('rechaza campos de más, también dentro de un componente (strictObject)', () => {
    expect(promotionCreateSchema.safeParse({ ...PROMO, isActive: true }).success).toBe(false);
    expect(promotionCreateSchema.safeParse({ ...PROMO, components: [{ ...DOCENA, menuItemId: ID }] }).success).toBe(false);
  });

  it('fuzz: ninguna entrada arbitraria hace lanzar al schema', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof promotionCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('schemas de edición, activación, borrado y fila', () => {
  it('editar pide todo de nuevo más la versión', () => {
    expect(promotionUpdateSchema.safeParse({ ...PROMO, version: 1 }).success).toBe(true);
    expect(promotionUpdateSchema.safeParse(PROMO).success).toBe(false);
  });

  it('activar y borrar exigen un id válido y una versión de al menos 1', () => {
    expect(promotionToggleSchema.safeParse({ id: ID, isActive: false, version: 1 }).success).toBe(true);
    expect(promotionToggleSchema.safeParse({ id: 'x', isActive: false, version: 1 }).success).toBe(false);
    expect(promotionDeleteSchema.safeParse({ id: ID, version: 0 }).success).toBe(false);
  });

  it('la fila convierte a número el precio que Postgres devuelve como texto', () => {
    const row = { id: ID, name: 'Promo', price: '15000.00', isActive: true, version: 1, components: [DOCENA], createdAt: new Date(0), updatedAt: new Date(0) };
    expect(promotionRowSchema.parse(row)).toMatchObject({ price: 15000, components: [DOCENA] });
  });
});

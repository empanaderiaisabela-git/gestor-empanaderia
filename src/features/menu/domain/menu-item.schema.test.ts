import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { menuItemCreateSchema, menuItemDeleteSchema, menuItemRowSchema, menuItemToggleSchema, menuItemUpdateSchema } from './menu-item.schema';

const EMPANADA = { group: 'empanadas', name: 'Carne suave' };
const PIZZA = { group: 'pizzas', name: 'Muzza' };
const ID = '11111111-1111-4111-8111-111111111111';

function messages(input: unknown): string[] {
  const result = menuItemCreateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('menuItemCreateSchema (US-3 CA-2, US-17)', () => {
  it('acepta sólo grupo y nombre, y recorta el nombre', () => {
    expect(menuItemCreateSchema.parse({ ...EMPANADA, name: '  Carne suave  ' })).toEqual(EMPANADA);
    expect(menuItemCreateSchema.parse(PIZZA)).toEqual(PIZZA);
  });

  it.each([
    { caso: 'nombre vacío', input: { ...PIZZA, name: '   ' }, message: 'El nombre es obligatorio' },
    { caso: 'nombre de 61 caracteres', input: { ...PIZZA, name: 'A'.repeat(61) }, message: 'El nombre no puede superar los 60 caracteres' },
    { caso: 'grupo inexistente', input: { ...PIZZA, group: 'tartas' }, message: 'Elegí un grupo válido' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });

  it('acepta el límite: nombre de 60 caracteres', () => {
    expect(messages({ ...PIZZA, name: 'A'.repeat(60) })).toEqual([]);
  });

  it.each([{ stock: 5 }, { unitCost: 3000 }, { prices: { price1: 1 } }])('rechaza campos de más (strictObject): %j', (extra) => {
    expect(menuItemCreateSchema.safeParse({ ...PIZZA, ...extra }).success).toBe(false);
  });

  it('fuzz: ninguna entrada arbitraria hace lanzar al schema', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof menuItemCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('schemas de edición, activación, borrado y fila', () => {
  it('editar exige nombre y versión, y nada más', () => {
    expect(menuItemUpdateSchema.safeParse({ name: 'Carne', version: 1 }).success).toBe(true);
    expect(menuItemUpdateSchema.safeParse({ name: 'Carne' }).success).toBe(false);
    expect(menuItemUpdateSchema.safeParse({ name: 'Carne', unitCost: 1, version: 1 }).success).toBe(false);
  });

  it('activar y borrar exigen un id válido y una versión de al menos 1', () => {
    expect(menuItemToggleSchema.safeParse({ id: ID, isActive: false, version: 1 }).success).toBe(true);
    expect(menuItemToggleSchema.safeParse({ id: 'x', isActive: false, version: 1 }).success).toBe(false);
    expect(menuItemDeleteSchema.safeParse({ id: ID, version: 0 }).success).toBe(false);
  });

  it('la fila convierte a número los importes y el stock que Postgres devuelve como texto', () => {
    const row = { id: ID, group: 'pizzas', name: 'Napolitana', unitCost: '3000.00', stock: '2.5', price1: '12000.00', price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, version: 1, createdAt: new Date(0), updatedAt: new Date(0) };
    expect(menuItemRowSchema.parse(row)).toMatchObject({ unitCost: 3000, stock: 2.5, price1: 12000, price3: null });
    expect(menuItemRowSchema.parse({ ...row, group: 'empanadas', price1: null })).toMatchObject({ price1: null });
    expect(menuItemRowSchema.parse({ ...row, unitCost: null })).toMatchObject({ unitCost: null });
  });
});

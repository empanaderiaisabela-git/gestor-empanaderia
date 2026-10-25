import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { menuItemCreateSchema, menuItemDeleteSchema, menuItemRowSchema, menuItemToggleSchema, menuItemUpdateSchema } from './menu-item.schema';

const EMPANADA = { group: 'empanadas', name: 'Carne suave', unitCost: 400 };
const SANGUCHE = { group: 'sanguches', name: 'Primavera', unitCost: 500, prices: { price1: 1500, price3: 4200, price6: 8000, price12: 15000 } };
const PIZZA = { group: 'pizzas', name: 'Muzza', unitCost: 3000, prices: { price1: 11000 } };
const ID = '11111111-1111-4111-8111-111111111111';

function messages(input: unknown): string[] {
  const result = menuItemCreateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('menuItemCreateSchema (US-3 CA-2)', () => {
  it('acepta una empanada sin precio propio, un sanguche con sus cuatro precios y una pizza con el de la entera', () => {
    expect(menuItemCreateSchema.parse({ ...EMPANADA, name: '  Carne suave  ' })).toEqual(EMPANADA);
    expect(menuItemCreateSchema.parse(SANGUCHE)).toEqual(SANGUCHE);
    expect(menuItemCreateSchema.parse(PIZZA)).toEqual(PIZZA);
  });

  it.each([
    { caso: 'nombre vacío', input: { ...PIZZA, name: '   ' }, message: 'El nombre es obligatorio' },
    { caso: 'nombre de 61 caracteres', input: { ...PIZZA, name: 'A'.repeat(61) }, message: 'El nombre no puede superar los 60 caracteres' },
    { caso: 'grupo inexistente', input: { ...PIZZA, group: 'tartas' }, message: 'Elegí un grupo válido' },
    { caso: 'costo negativo', input: { ...PIZZA, unitCost: -1 }, message: 'El costo no puede ser negativo' },
    { caso: 'precio 0', input: { ...PIZZA, prices: { price1: 0 } }, message: 'El precio debe ser mayor a 0' },
    { caso: 'precio con 3 decimales', input: { ...PIZZA, prices: { price1: 10.555 } }, message: 'Máximo 2 decimales' },
    { caso: 'pizza sin precio', input: { ...PIZZA, prices: undefined }, message: 'Falta el precio del gusto' },
    { caso: 'sanguche sin el precio de 12', input: { ...SANGUCHE, prices: { price1: 1, price3: 3, price6: 6 } }, message: 'Falta el precio de 12 unidades' },
    { caso: 'pizza con precio de 6 unidades', input: { ...PIZZA, prices: { price1: 10, price6: 50 } }, message: 'Este grupo no se vende en esa presentación' },
    { caso: 'empanada con precio propio', input: { ...EMPANADA, prices: { price1: 1200 } }, message: 'Este grupo usa el mismo precio para todos los gustos' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });

  it('acepta los límites: nombre de 60 y costo 0', () => {
    expect(messages({ ...PIZZA, name: 'A'.repeat(60), unitCost: 0 })).toEqual([]);
  });

  it('rechaza campos de más, también dentro de los precios (strictObject)', () => {
    expect(menuItemCreateSchema.safeParse({ ...PIZZA, stock: 5 }).success).toBe(false);
    expect(menuItemCreateSchema.safeParse({ ...PIZZA, prices: { price1: 1, price2: 2 } }).success).toBe(false);
  });

  it('fuzz: ninguna entrada arbitraria hace lanzar al schema', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof menuItemCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('schemas de edición, activación, borrado y fila', () => {
  it('editar exige nombre, costo y versión; los precios son opcionales (los valida el service con el grupo)', () => {
    expect(menuItemUpdateSchema.safeParse({ name: 'Carne', unitCost: 1, version: 1 }).success).toBe(true);
    expect(menuItemUpdateSchema.safeParse({ name: 'Carne', unitCost: 1, prices: { price1: 2 } }).success).toBe(false);
  });

  it('activar y borrar exigen un id válido y una versión de al menos 1', () => {
    expect(menuItemToggleSchema.safeParse({ id: ID, isActive: false, version: 1 }).success).toBe(true);
    expect(menuItemToggleSchema.safeParse({ id: 'x', isActive: false, version: 1 }).success).toBe(false);
    expect(menuItemDeleteSchema.safeParse({ id: ID, version: 0 }).success).toBe(false);
  });

  it('la fila convierte a número los importes y el stock que Postgres devuelve como texto', () => {
    const row = { id: ID, group: 'pizzas', name: 'Napolitana', unitCost: '3000.00', stock: '2.5', price1: '12000.00', price3: null, price6: null, price12: null, isActive: true, version: 1, createdAt: new Date(0), updatedAt: new Date(0) };
    expect(menuItemRowSchema.parse(row)).toMatchObject({ unitCost: 3000, stock: 2.5, price1: 12000, price3: null });
    expect(menuItemRowSchema.parse({ ...row, group: 'empanadas', price1: null })).toMatchObject({ price1: null });
  });
});

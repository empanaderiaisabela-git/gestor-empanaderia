import { describe, expect, it } from 'vitest';
import { blankComponent, initialValues, parseCreate, parseUpdate } from './promotion-form';

const VALUES = { name: 'Docena + Coca', price: '15000,50', components: [{ group: 'empanadas' as const, presentationKey: 'u12', quantity: '1' }] };

describe('formulario de Promociones (US-8 CA-1 y CA-2)', () => {
  it('un componente nuevo arranca con la primera presentación del grupo y cantidad 1', () => {
    expect(blankComponent()).toEqual({ group: 'empanadas', presentationKey: 'u1', quantity: '1' });
    expect(blankComponent('pizzas')).toEqual({ group: 'pizzas', presentationKey: 'pizza_1', quantity: '1' });
  });

  it('una promo nueva arranca vacía con un componente; al editar trae lo guardado', () => {
    expect(initialValues(null)).toEqual({ name: '', price: '', components: [blankComponent()] });
    const promotion = { id: 'x', name: 'Promo', price: 9000, isActive: true, version: 2, components: [{ group: 'pepsi' as const, presentationKey: 'u1', quantity: 2 }], createdAt: '', updatedAt: '' };
    expect(initialValues(promotion)).toEqual({ name: 'Promo', price: '9000', components: [{ group: 'pepsi', presentationKey: 'u1', quantity: '2' }] });
  });

  it('convierte el precio con coma y las cantidades a número', () => {
    expect(parseCreate(VALUES)).toEqual({ ok: true, input: { name: 'Docena + Coca', price: 15000.5, components: [{ group: 'empanadas', presentationKey: 'u12', quantity: 1 }] } });
  });

  it('marca el error de cada parte del formulario', () => {
    expect(parseCreate({ name: '', price: '', components: [] })).toEqual({
      ok: false,
      errors: { name: 'El nombre es obligatorio', price: 'Ingresá un precio válido', components: 'Agregá al menos un producto' },
    });
    expect(parseCreate({ ...VALUES, components: [{ ...VALUES.components[0], quantity: '0' }] })).toMatchObject({ ok: false, errors: { components: 'La cantidad debe ser al menos 1' } });
  });

  it('al editar manda la versión', () => {
    expect(parseUpdate(VALUES, 3)).toMatchObject({ ok: true, input: { version: 3, price: 15000.5 } });
    expect(parseUpdate({ ...VALUES, price: '0' }, 3)).toMatchObject({ ok: false, errors: { price: 'El precio debe ser mayor a 0' } });
  });
});

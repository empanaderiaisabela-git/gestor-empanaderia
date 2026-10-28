import { describe, expect, it } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { initialValues, parseCreate, parseUpdate } from './menu-item-form';

const BLANK = initialValues(null);

describe('formulario de Alta de productos', () => {
  it('arranca vacío, en Empanadas', () => {
    expect(BLANK).toEqual({ group: 'empanadas', name: '' });
  });

  it('al crear manda grupo y nombre', () => {
    expect(parseCreate({ group: 'sanguches', name: 'Primavera' })).toEqual({ ok: true, input: { group: 'sanguches', name: 'Primavera' } });
  });

  it('marca el nombre vacío', () => {
    expect(parseCreate(BLANK)).toEqual({ ok: false, errors: { name: 'El nombre es obligatorio' } });
    expect(parseUpdate(BLANK, 1)).toEqual({ ok: false, errors: { name: 'El nombre es obligatorio' } });
  });

  it('al editar manda nombre y versión', () => {
    expect(parseUpdate({ group: 'sanguches', name: 'Primavera' }, 2)).toEqual({ ok: true, input: { name: 'Primavera', version: 2 } });
  });

  it('carga los valores de un gusto existente', () => {
    const pizza: MenuItemDef = { id: 'x', group: 'pizzas', name: 'Muzza', unitCost: 3000, stock: 2.5, price1: 11000, price3: null, price6: null, price12: null, isActive: true, isVisible: false, version: 3, createdAt: '', updatedAt: '' };
    expect(initialValues(pizza)).toEqual({ group: 'pizzas', name: 'Muzza' });
  });
});

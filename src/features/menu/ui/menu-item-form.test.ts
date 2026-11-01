import { describe, expect, it } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { initialValues, parseCreate, parseUpdate } from './menu-item-form';

const BLANK = initialValues(null);
const NO_DRINK = { drinkName: '', size: '', flavor: '' };
const BEBIDA: MenuItemDef = { id: 'x', group: 'coca_cola', name: '', unitCost: null, stock: 0, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 1, createdAt: '', updatedAt: '' };

describe('formulario de Alta de productos', () => {
  it('arranca vacío, en Empanadas', () => {
    expect(BLANK).toEqual({ group: 'empanadas', name: '', ...NO_DRINK });
  });

  it('al crear manda grupo y nombre', () => {
    expect(parseCreate({ group: 'sanguches', name: 'Primavera', ...NO_DRINK })).toEqual({ ok: true, input: { group: 'sanguches', name: 'Primavera' } });
  });

  it('marca el nombre vacío', () => {
    expect(parseCreate(BLANK)).toEqual({ ok: false, errors: { name: 'El nombre es obligatorio' } });
    expect(parseUpdate(BLANK, 1)).toEqual({ ok: false, errors: { name: 'El nombre es obligatorio' } });
  });

  it('al editar manda nombre y versión', () => {
    expect(parseUpdate({ group: 'sanguches', name: 'Primavera', ...NO_DRINK }, 2)).toEqual({ ok: true, input: { name: 'Primavera', version: 2 } });
  });

  it('carga los valores de un gusto existente', () => {
    const pizza: MenuItemDef = { id: 'x', group: 'pizzas', name: 'Muzza', unitCost: 3000, stock: 2.5, price1: 11000, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 3, createdAt: '', updatedAt: '' };
    expect(initialValues(pizza)).toEqual({ group: 'pizzas', name: 'Muzza', ...NO_DRINK });
  });

  it('una bebida manda bebida, litros con punto o coma y sabor opcional (US-51)', () => {
    const values = { ...BLANK, group: 'coca_cola' as const, drinkName: 'Aquarius', size: '1,5L', flavor: '' };
    expect(parseCreate(values)).toEqual({ ok: true, input: { group: 'coca_cola', drinkName: 'Aquarius', size: '1.5L', flavor: null } });
    expect(parseUpdate({ ...values, flavor: 'Pera' }, 3)).toEqual({ ok: true, input: { drinkName: 'Aquarius', size: '1.5L', flavor: 'Pera', version: 3 } });
    expect(parseCreate({ ...values, drinkName: '', size: '' })).toEqual({ ok: false, errors: { drinkName: 'La bebida es obligatoria', size: 'Ingresá los litros' } });
  });
  it('regression BUG-29: una bebida vieja se edita precargada desde su nombre', () => {
    const vieja = (name: string): MenuItemDef => ({ ...BEBIDA, name });
    expect(initialValues(vieja('Aquarius 1,5 L Manzana'))).toMatchObject({ drinkName: 'Aquarius', size: '1.5 L', flavor: 'Manzana' });
    expect(initialValues(vieja('Coca-Cola 500 ml'))).toMatchObject({ drinkName: 'Coca-Cola', size: '500 ml', flavor: '' });
    expect(initialValues(vieja('7up 1,5L'))).toMatchObject({ drinkName: '7up', size: '1.5 L', flavor: '' });
    expect(initialValues(vieja('Agua saborizada'))).toMatchObject({ drinkName: 'Agua saborizada', size: '', flavor: '' });
  });
});

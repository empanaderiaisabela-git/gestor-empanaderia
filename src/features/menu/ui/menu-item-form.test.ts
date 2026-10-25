import { describe, expect, it } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { initialValues, parseCreate, parseUpdate } from './menu-item-form';

const BLANK = initialValues(null);
const SANGUCHE = { ...BLANK, group: 'sanguches' as const, name: 'Primavera', unitCost: '500', price1: '1500', price3: '4200', price6: '8000', price12: '15000' };

describe('formulario de Alta de productos', () => {
  it('arranca vacío, en Empanadas', () => {
    expect(BLANK).toEqual({ group: 'empanadas', name: '', unitCost: '', price1: '', price3: '', price6: '', price12: '' });
  });

  it('una empanada se crea sin precios propios aunque el formulario tenga texto en ellos', () => {
    expect(parseCreate({ ...BLANK, name: 'Humita', unitCost: '350,5', price1: '999' })).toEqual({ ok: true, input: { group: 'empanadas', name: 'Humita', unitCost: 350.5 } });
  });

  it('un sanguche lleva sus cuatro precios convertidos a número', () => {
    expect(parseCreate(SANGUCHE)).toEqual({ ok: true, input: { group: 'sanguches', name: 'Primavera', unitCost: 500, prices: { price1: 1500, price3: 4200, price6: 8000, price12: 15000 } } });
  });

  it('marca cada campo con su error', () => {
    const result = parseCreate({ ...SANGUCHE, name: '', unitCost: '', price12: '' });
    expect(result).toEqual({ ok: false, errors: { name: 'El nombre es obligatorio', unitCost: 'Ingresá un costo válido', price12: 'Ingresá un precio válido' } });
  });

  it('al editar valida los precios del grupo del gusto y manda la versión', () => {
    expect(parseUpdate({ ...SANGUCHE, price3: '' }, 2)).toMatchObject({ ok: false, errors: { price3: 'Ingresá un precio válido' } });
    expect(parseUpdate(SANGUCHE, 2)).toMatchObject({ ok: true, input: { name: 'Primavera', version: 2, prices: { price6: 8000 } } });
  });

  it('carga los valores de un gusto existente para editarlo', () => {
    const pizza: MenuItemDef = { id: 'x', group: 'pizzas', name: 'Muzza', unitCost: 3000, stock: 2.5, price1: 11000, price3: null, price6: null, price12: null, isActive: true, version: 3, createdAt: '', updatedAt: '' };
    expect(initialValues(pizza)).toEqual({ group: 'pizzas', name: 'Muzza', unitCost: '3000', price1: '11000', price3: '', price6: '', price12: '' });
  });
});

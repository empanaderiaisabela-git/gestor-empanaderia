import { describe, expect, it } from 'vitest';
import { parseEntry, parseLoss } from './stock-forms';

const ITEM = '11111111-1111-4111-8111-111111111111';
const PROVIDER = '22222222-2222-4222-8222-222222222222';
const NO_PRICES = { price1: '', price3: '', price6: '', price12: '' };

describe('formularios de Stock', () => {
  it('el admin manda cantidad, costo y proveedor', () => {
    expect(parseEntry({ menuItemId: ITEM, quantity: '24', unitCost: '450,5', providerId: PROVIDER, ...NO_PRICES })).toEqual({ ok: true, input: { menuItemId: ITEM, quantity: 24, unitCost: 450.5, providerId: PROVIDER } });
  });

  it('el admin puede dejar el costo vacío (se conserva el actual) y sin proveedor', () => {
    expect(parseEntry({ menuItemId: ITEM, quantity: '6', unitCost: '', providerId: '', ...NO_PRICES })).toEqual({ ok: true, input: { menuItemId: ITEM, quantity: 6, providerId: null } });
  });

  it('manda los precios de venta sólo si se cargó alguno', () => {
    const values = { menuItemId: ITEM, quantity: '6', unitCost: '', providerId: '', ...NO_PRICES, price1: '11000', price3: '30,5' };
    expect(parseEntry(values)).toEqual({ ok: true, input: { menuItemId: ITEM, quantity: 6, providerId: null, prices: { price1: 11000, price3: 30.5 } } });
  });

  it('marca el error en el campo del precio', () => {
    const values = { menuItemId: ITEM, quantity: '6', unitCost: '', providerId: '', ...NO_PRICES, price1: '-5' };
    expect(parseEntry(values)).toEqual({ ok: false, errors: { price1: 'El precio debe ser mayor a 0' } });
  });

  it('marca los errores por campo', () => {
    expect(parseEntry({ menuItemId: '', quantity: '0', unitCost: '', providerId: '', ...NO_PRICES })).toEqual({ ok: false, errors: { menuItemId: 'Elegí un gusto o bebida', quantity: 'La cantidad debe ser mayor a 0' } });
  });

  it('la merma convierte la cantidad (media pizza) y exige motivo', () => {
    expect(parseLoss(ITEM, { quantity: '0,5', reason: 'Se quemó' })).toEqual({ ok: true, input: { menuItemId: ITEM, quantity: 0.5, reason: 'Se quemó' } });
    expect(parseLoss(ITEM, { quantity: '', reason: '' })).toEqual({ ok: false, errors: { quantity: 'Ingresá una cantidad', reason: 'Debe especificar un motivo' } });
  });
});

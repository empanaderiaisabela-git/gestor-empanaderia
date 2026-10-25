import { describe, expect, it } from 'vitest';
import { auditReference, entityLabel } from './audit-reference';

const EMPTY = { customer: null, provider: null, targetUser: null, sale: null, detail: null };

describe('referencia de cada registro de auditoría (T-12)', () => {
  it.each([
    { caso: 'cliente', log: { ...EMPTY, customer: { id: 'c', name: 'Marta' } }, expected: 'Marta' },
    { caso: 'proveedor', log: { ...EMPTY, provider: { id: 'p', name: 'Molino del Sur' } }, expected: 'Molino del Sur' },
    { caso: 'usuario', log: { ...EMPTY, targetUser: { id: 'u', username: 'vendedora' } }, expected: 'vendedora' },
    { caso: 'venta', log: { ...EMPTY, sale: { id: 's', total: '18500.00' } }, expected: '$18.500' },
    { caso: 'gusto, desde el detalle', log: { ...EMPTY, detail: { name: 'Carne picante', stockAfter: 12 } }, expected: 'Carne picante' },
    { caso: 'sin datos', log: { ...EMPTY, detail: { name: '' } }, expected: null },
    { caso: 'detalle que no es objeto', log: { ...EMPTY, detail: 'texto' }, expected: null },
  ])('$caso → $expected', ({ log, expected }) => {
    expect(auditReference(log)).toBe(expected);
  });

  it('nombra cada entidad en español, sin restos de la casa de celulares', () => {
    expect(['MENU_ITEM', 'STOCK_ENTRY', 'STOCK_LOSS', 'SALE', 'OTRA'].map(entityLabel)).toEqual(['PRODUCTO', 'STOCK', 'MERMA', 'VENTA', 'OTRA']);
  });
});

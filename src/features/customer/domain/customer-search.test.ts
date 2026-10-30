import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_SUGGESTIONS, suggestCustomers } from './customer-search';

const customer = (id: string, name: string, phone = '') => ({ id, name, phone, isActive: true });
const CUSTOMERS = [customer('1', 'Martín Gómez', '11 5555-1234'), customer('2', 'MARTA'), { ...customer('3', 'Marcos'), isActive: false }, customer('4', 'Rocío', '351 400 1234')];

describe('sugerencias de clientes en el carrito (US-37 CA-3)', () => {
  it('desde 2 letras, sin importar mayúsculas ni acentos, sólo activos', () => {
    expect(suggestCustomers(CUSTOMERS, ['mart']).map((found) => found.id)).toEqual(['1', '2']);
    expect(suggestCustomers(CUSTOMERS, ['MARTIN']).map((found) => found.id)).toEqual(['1']);
    expect(suggestCustomers(CUSTOMERS, ['m'])).toEqual([]);
    expect(suggestCustomers(CUSTOMERS, ['marc'])).toEqual([]);
  });

  it('también busca por teléfono', () => {
    expect(suggestCustomers(CUSTOMERS, ['', '400 12']).map((found) => found.id)).toEqual(['4']);
  });

  it('fuzz: nunca devuelve más de 5 ni clientes inactivos', () => {
    const anyCustomer = fc.record({ id: fc.uuid(), name: fc.string(), phone: fc.string(), isActive: fc.boolean() });
    fc.assert(
      fc.property(fc.array(anyCustomer, { maxLength: 30 }), fc.array(fc.string(), { maxLength: 2 }), (customers, terms) => {
        const found = suggestCustomers(customers, terms);
        return found.length <= MAX_SUGGESTIONS && found.every((match) => match.isActive);
      })
    );
  });
});

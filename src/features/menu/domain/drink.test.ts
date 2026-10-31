import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { drinkNameOf, flavor, liters, parseLiters, sameFamily } from './drink';

const AQUARIUS = { group: 'coca_cola' as const, drinkName: 'Aquarius', liters: 1.5 };

describe('bebidas con bebida, litros y sabor (US-49)', () => {
  it('arma el nombre con litros con punto y el sabor opcional (P-2)', () => {
    expect(drinkNameOf({ drinkName: 'Aquarius', liters: 1.5, flavor: 'Manzana' })).toBe('Aquarius 1.5 L Manzana');
    expect(drinkNameOf({ drinkName: 'Coca-Cola', liters: 0.5, flavor: null })).toBe('Coca-Cola 0.5 L');
  });

  it('los litros se escriben con punto o coma y quedan con punto', () => {
    expect([parseLiters('1,5'), parseLiters('1.5'), parseLiters(' 0,354 ')]).toEqual([1.5, 1.5, 0.354]);
    expect(parseLiters('')).toBeNaN();
  });

  it.each([
    { valor: 0, mensaje: 'Los litros deben ser mayores a 0' },
    { valor: 11, mensaje: 'Demasiados litros' },
    { valor: 1.2345, mensaje: 'Hasta 3 decimales' },
  ])('rechaza $valor litros con el mensaje exacto', ({ valor, mensaje }) => {
    expect(liters.safeParse(valor).error?.issues[0].message).toBe(mensaje);
  });

  it('el sabor vacío es "sin sabor"', () => {
    expect([flavor.parse('  '), flavor.parse(null), flavor.parse(' Pera ')]).toEqual([null, null, 'Pera']);
  });

  it('una familia es el mismo grupo, la misma bebida (sin importar mayúsculas) y los mismos litros', () => {
    expect(sameFamily(AQUARIUS, { ...AQUARIUS, drinkName: 'aquarius' })).toBe(true);
    expect(sameFamily(AQUARIUS, { ...AQUARIUS, liters: 1 })).toBe(false);
    expect(sameFamily(AQUARIUS, { ...AQUARIUS, group: 'pepsi' })).toBe(false);
    expect(sameFamily(AQUARIUS, { ...AQUARIUS, drinkName: null })).toBe(false);
  });

  it('el nombre armado entra siempre en 60 caracteres (fuzz)', () => {
    const text = fc.string({ minLength: 1, maxLength: 25 });
    fc.assert(fc.property(text, fc.integer({ min: 1, max: 10000 }), fc.option(text), (name, thousandthsOfLiter, taste) => {
      expect(drinkNameOf({ drinkName: name, liters: thousandthsOfLiter / 1000, flavor: taste }).length).toBeLessThanOrEqual(60);
    }));
  });
});

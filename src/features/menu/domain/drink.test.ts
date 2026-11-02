import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { drinkName, drinkNameOf, flavor, sameFamily, size, sizeOf } from './drink';

const AQUARIUS = { group: 'coca_cola' as const, drinkName: 'Aquarius', drinkSize: '1.5L', liters: null };

describe('bebidas con bebida, litros o mililitros y sabor (US-51)', () => {
  it('arma el nombre con el texto de litros tal cual y el sabor opcional', () => {
    expect(drinkNameOf({ drinkName: 'Aquarius', size: '500CC', flavor: 'Manzana' })).toBe('Aquarius 500CC Manzana');
    expect(drinkNameOf({ drinkName: 'Coca-Cola', size: '1.5L', flavor: null })).toBe('Coca-Cola 1.5L');
  });

  it('los litros se escriben con punto o coma y quedan con punto', () => {
    expect([size.parse('1,5L'), size.parse(' 1.5L ')]).toEqual(['1.5L', '1.5L']);
    expect(size.safeParse('').error?.issues[0].message).toBe('Ingresá los litros');
    expect(size.safeParse('123456789').error?.issues[0].message).toBe('Los litros no pueden superar los 8 caracteres');
  });

  it('lee los litros nuevos como texto y los viejos numéricos', () => {
    expect(sizeOf({ drinkSize: '500CC', liters: null })).toBe('500CC');
    expect([sizeOf({ drinkSize: null, liters: '1.500' }), sizeOf({ drinkSize: null, liters: 0.5 })]).toEqual(['1.5 L', '0.5 L']);
    expect(sizeOf({ drinkSize: null, liters: null })).toBeNull();
  });

  it('el sabor vacío es "sin sabor"', () => {
    expect([flavor.parse('  '), flavor.parse(null), flavor.parse(' Pera ')]).toEqual([null, null, 'Pera']);
  });

  it('una familia es el mismo grupo, la misma bebida y los mismos litros, exactos', () => {
    expect(sameFamily(AQUARIUS, { ...AQUARIUS })).toBe(true);
    expect(sameFamily(AQUARIUS, { ...AQUARIUS, drinkName: 'aquarius' })).toBe(false);
    expect([sameFamily(AQUARIUS, { ...AQUARIUS, drinkSize: '1.5 L' }), sameFamily(AQUARIUS, { ...AQUARIUS, drinkSize: '1L' })]).toEqual([false, false]);
    expect([sameFamily(AQUARIUS, { ...AQUARIUS, group: 'pepsi' }), sameFamily(AQUARIUS, { ...AQUARIUS, drinkName: null })]).toEqual([false, false]);
  });

  it('la bebida acepta hasta 30 caracteres (US-53)', () => {
    expect(drinkName.safeParse('a'.repeat(30)).success).toBe(true);
    expect(drinkName.safeParse('a'.repeat(31)).error?.issues[0]?.message).toBe('La bebida no puede superar los 30 caracteres');
  });

  it('el nombre armado entra siempre en 65 caracteres (fuzz)', () => {
    const text = fc.string({ minLength: 1, maxLength: 30 });
    const taste = fc.string({ minLength: 1, maxLength: 25 });
    const amount = fc.string({ minLength: 1, maxLength: 8 });
    fc.assert(fc.property(text, amount, fc.option(taste), (name, liters, flavor) => {
      expect(drinkNameOf({ drinkName: name, size: liters, flavor }).length).toBeLessThanOrEqual(65);
    }));
  });
});

import { describe, expect, it } from 'vitest';
import { SEED_GROUP_PRICES, SEED_MENU_ITEMS } from './menu-seed-data';

const namesOf = (group: string): string[] => SEED_MENU_ITEMS.filter((item) => item.group === group).map((item) => item.name);

describe('seed del menú: los gustos que dispone el local (specs.md)', () => {
  it('carga los 15 gustos de empanadas, las 6 pizzas, los 2 sanguches de miga y las 4 ciabattas', () => {
    expect(namesOf('empanadas')).toHaveLength(15);
    expect(namesOf('empanadas')).toContain('Muzza, cebolla y roquefort');
    expect(namesOf('pizzas')).toEqual(['Muzza', 'Muzza y jamón', 'Napolitana', 'Napolitana con jamón', 'Pepperoni', 'Roquefort']);
    expect(namesOf('sanguches')).toEqual(['Primavera', 'Jamón y queso']);
    expect(namesOf('ciabattas')).toEqual(['Carne', 'Capresse', 'Bondiola', 'Pollo']);
  });

  it('empanadas y ciabattas tienen precio del grupo y sus gustos, ninguno propio', () => {
    expect(SEED_GROUP_PRICES.map((row) => row.group)).toEqual(['empanadas', 'ciabattas']);
    expect(SEED_MENU_ITEMS.filter((item) => ['empanadas', 'ciabattas'].includes(item.group)).every((item) => item.prices === undefined)).toBe(true);
  });

  it('los sanguches difieren en precio, y cada pizza tiene el suyo', () => {
    const [primavera, jamonYQueso] = SEED_MENU_ITEMS.filter((item) => item.group === 'sanguches');
    expect(primavera.prices?.price1).not.toBe(jamonYQueso.prices?.price1);
    expect(new Set(SEED_MENU_ITEMS.filter((item) => item.group === 'pizzas').map((item) => item.prices?.price1)).size).toBe(6);
  });

  it('no repite nombres dentro de un grupo', () => {
    const keys = SEED_MENU_ITEMS.map((item) => `${item.group}/${item.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

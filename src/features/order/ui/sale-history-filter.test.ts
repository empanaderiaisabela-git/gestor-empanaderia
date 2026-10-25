import { describe, expect, it } from 'vitest';
import { describeSaleLine } from '@/features/order/domain/order-describe';
import { MORNING_SALE, saleDef } from '../testing/sale-fixtures';
import { filterSales, NO_FILTERS } from './sale-history-filter';

const SALES = [saleDef(), MORNING_SALE];
const ids = (filters: Partial<typeof NO_FILTERS>): string[] => filterSales(SALES, { ...NO_FILTERS, ...filters }).map((sale) => sale.id);

describe('filtros del historial de ventas (US-7 CA-1)', () => {
  it('sin filtros muestra todo', () => {
    expect(ids({})).toEqual([SALES[0].id, MORNING_SALE.id]);
  });

  it('busca por comprador ("Sin nombre" incluido) o por vendedor, sin importar tildes ni mayúsculas', () => {
    expect(ids({ search: 'marta' })).toEqual([SALES[0].id]);
    expect(ids({ search: 'sin nombre' })).toEqual([MORNING_SALE.id]);
    expect(ids({ search: 'VENDEDORA marta' })).toEqual([SALES[0].id]);
    expect(ids({ search: 'nadie' })).toEqual([]);
  });

  it('filtra por día de Argentina, con los dos extremos incluidos', () => {
    expect(ids({ startDate: '2026-10-25' })).toEqual([SALES[0].id]);
    expect(ids({ endDate: '2026-10-24' })).toEqual([MORNING_SALE.id]);
    expect(ids({ startDate: '2026-10-24', endDate: '2026-10-25' })).toHaveLength(2);
  });

  it('describe una línea guardada con su presentación y sus gustos', () => {
    expect(describeSaleLine(SALES[0].lines[0])).toBe('Empanadas · ½ docena: 2 Carne + 4 Pollo');
    expect(describeSaleLine({ group: 'coca_cola', presentationKey: 'u1', quantity: 2, description: 'Coca 500' })).toBe('Coca-Cola · 1 unidad × 2: Coca 500');
  });
});

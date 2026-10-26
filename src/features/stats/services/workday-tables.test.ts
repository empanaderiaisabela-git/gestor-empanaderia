import { describe, expect, it } from 'vitest';
import type { StatsSale } from '@/features/stats/domain/stats.schema';
import { saleRows, vendorRows } from './workday-tables';

type SaleSeed = { vendor: string; at: string; total: string; buyerName?: string | null };

function sale({ vendor, at, total, buyerName = null }: SaleSeed): StatsSale {
  return { createdAt: new Date(at), total, buyerName, vendor, lines: [], items: [], payments: [] };
}

const SALES = [
  sale({ vendor: 'rocio', at: '2026-10-25T20:30:00-03:00', total: '9000.00', buyerName: 'Juan' }),
  sale({ vendor: 'ana', at: '2026-10-25T12:00:00-03:00', total: '1500.00' }),
  sale({ vendor: 'rocio', at: '2026-10-25T13:00:00-03:00', total: '2500.50', buyerName: '  ' }),
  sale({ vendor: 'rocio', at: '2026-10-26T00:30:00-03:00', total: '3000.00', buyerName: 'Marta' }),
  sale({ vendor: 'ana', at: '2026-10-25T16:59:00-03:00', total: '500.00', buyerName: 'Pedro' }),
];

describe('cuadros de la jornada (US-13 CA-1 y CA-2)', () => {
  it('vendedores: ventas e importe por vendedor y turno, mañana antes que tarde', () => {
    expect(vendorRows(SALES)).toEqual([
      { vendor: 'ana', shift: 'morning', count: 2, amount: 2000 },
      { vendor: 'rocio', shift: 'morning', count: 1, amount: 2500.5 },
      { vendor: 'rocio', shift: 'afternoon', count: 2, amount: 12000 },
    ]);
  });

  it('ventas: comprador ("Sin nombre" si no hay), hora e importe, ordenadas por hora', () => {
    expect(saleRows(SALES).map((row) => [row.buyer, row.at, row.amount])).toEqual([
      ['Sin nombre', '2026-10-25T15:00:00.000Z', 1500],
      ['Sin nombre', '2026-10-25T16:00:00.000Z', 2500.5],
      ['Pedro', '2026-10-25T19:59:00.000Z', 500],
      ['Juan', '2026-10-25T23:30:00.000Z', 9000],
      ['Marta', '2026-10-26T03:30:00.000Z', 3000],
    ]);
  });

  it('sin ventas, los dos cuadros vacíos', () => {
    expect([vendorRows([]), saleRows([])]).toEqual([[], []]);
  });
});

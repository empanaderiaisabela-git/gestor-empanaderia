import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SaleRow } from '@/features/stats/domain/stats.schema';
import { SalesTable } from './workday-tables';

const ROWS: SaleRow[] = Array.from({ length: 40 }, (_, index) => ({ buyer: `Cliente ${index}`, at: '2026-10-26T03:30:00.000Z', amount: 1000 }));

describe('cuadros de abajo de Estadísticas (US-42)', () => {
  it('se ven 5 ventas; con más, el cuadro scrollea por dentro con el encabezado fijo, sin estirar la página', () => {
    render(<SalesTable rows={ROWS} withDate={false} />);
    const table = screen.getByRole('table', { name: 'Ventas' });
    const ventana = table.parentElement;
    expect(ventana?.className).toContain('max-h-56 overflow-y-auto');
    expect(ventana?.tabIndex).toBe(0);
    expect(table.querySelector('thead')?.className).toContain('sticky top-0');
    expect(screen.getAllByRole('row')).toHaveLength(41);
  });
});

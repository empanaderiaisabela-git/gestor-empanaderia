import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { StatsPanel } from './stats-panel';

const action = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/features/stats/actions/fetch-workday-stats', () => ({ fetchWorkdayStats: action.fetch }));

const STATS: WorkdayStats = {
  from: '2026-10-25',
  to: '2026-10-25',
  vendorTable: [
    { vendor: 'ana', shift: 'morning', count: 3, amount: 15000 },
    { vendor: 'ana', shift: 'afternoon', count: 4, amount: 27100 },
  ],
  saleTable: [{ buyer: 'Sin nombre', at: '2026-10-26T03:30:00.000Z', amount: 6600 }],
  byGroup: { empanadas: 12000, pizzas: 11000, sanguches: 0, ciabattas: 6000, coca_cola: 3500, pepsi: 0 },
  promos: 9000,
  revenue: 42100,
  profit: 20000,
  salesCount: 7,
  byPayment: { efectivo: 20000, transferencia: 10000, debito: 5500, credito: 6600 },
};

const card = (name: string): HTMLElement => screen.getByRole('region', { name });

describe('pantalla de Estadísticas (US-12 CA-1 a CA-5)', () => {
  beforeEach(() => {
    useStatsStore.setState({ stats: null, isLoaded: false });
    action.fetch.mockImplementation(async (period: { from: string; to: string }) => ({ success: true, data: { ...STATS, ...period } }));
  });

  it('abre con la jornada de hoy y muestra cada comida con su color, las promos, la ganancia, las ventas y los 4 medios', async () => {
    render(<StatsPanel />);
    expect(await within(await screen.findByRole('region', { name: 'Empanadas' })).findByText('$12.000')).toBeDefined();
    expect(card('Empanadas').className).toContain('border-group-empanadas-accent');
    expect(card('Empanadas').className).toContain('bg-group-empanadas-accent/5 dark:border-group-empanadas-dark-accent dark:bg-group-empanadas-dark-accent/10');
    expect(card('Ganancia').className).toContain('bg-stat-profit-accent/5 dark:border-stat-profit-dark-accent dark:bg-stat-profit-dark-accent/10');
    expect(card('Efectivo').className).toContain('bg-pay-efectivo');
    expect(within(card('Promos')).getByText('$9.000')).toBeDefined();
    expect(within(card('Ganancia')).getByText('$20.000')).toBeDefined();
    expect(within(card('Ventas registradas')).getByText('7')).toBeDefined();
    expect(['Efectivo', 'Transferencia', 'Débito', 'Crédito'].map((name) => within(card(name)).getByText(/\$/).textContent)).toEqual(['$20.000', '$10.000', '$5.500', '$6.600']);
    const today = expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/);
    expect(action.fetch).toHaveBeenCalledWith({ from: today, to: today });
  });

  it('muestra las comidas en filas de 4 y 3, después ventas y ganancia, y los medios de pago; sin Total facturado (US-21)', async () => {
    render(<StatsPanel />);
    await screen.findByRole('region', { name: 'Empanadas' });
    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual(['Empanadas', 'Pizzas', 'Sándwich de miga', 'Ciabattas', 'Coca-Cola', 'Quilmes', 'Promos', 'Ventas registradas', 'Ganancia', 'Efectivo', 'Transferencia', 'Débito', 'Crédito']);
    expect(screen.queryByText('Dinero generado por comida')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Total facturado' })).toBeNull();
  });

  it('abajo, el cuadro de vendedores por turno y el de ventas con su hora en Argentina (US-13)', async () => {
    render(<StatsPanel />);
    const vendedores = await screen.findByRole('table', { name: 'Vendedores' });
    expect(within(vendedores).getAllByRole('row').map((row) => row.textContent)).toEqual(['VendedorTurnoVentasImporte', 'anaMañana3$15.000', 'anaTarde4$27.100']);
    expect(within(screen.getByRole('table', { name: 'Ventas' })).getAllByRole('row')[1].textContent).toBe('Sin nombre00:30$6.600');
  });

  it('elegir "Desde" y "Hasta" pide ese rango al servidor; un "Desde" posterior mueve también "Hasta" (US-32)', async () => {
    render(<StatsPanel />);
    fireEvent.change(await screen.findByLabelText('Desde'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-31' } });
    await waitFor(() => expect(action.fetch).toHaveBeenLastCalledWith({ from: '2026-10-01', to: '2026-10-31' }));
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-05' } });
    await waitFor(() => expect(action.fetch).toHaveBeenLastCalledWith({ from: '2026-11-05', to: '2026-11-05' }));
  });

  it('con un rango de varios días, el cuadro de ventas muestra la fecha y la hora (US-32)', async () => {
    render(<StatsPanel />);
    fireEvent.change(await screen.findByLabelText('Desde'), { target: { value: '2026-10-01' } });
    const ventas = await screen.findByRole('table', { name: 'Ventas' });
    await waitFor(() => expect(within(ventas).getAllByRole('row')[1].textContent).toBe('Sin nombre26/10/2026, 00:30$6.600'));
  });

  it('los calendarios van a la derecha del título, con "Fecha de inicio" y "Fecha de fin" debajo (US-40)', async () => {
    render(<StatsPanel />);
    const fila = (await screen.findByRole('heading', { name: 'Resumen de la actividad' })).closest('.justify-between');
    expect(fila?.contains(screen.getByLabelText('Desde'))).toBe(true);
    expect(screen.getAllByText(/^Fecha de (inicio|fin)$/).map((caption) => caption.textContent)).toEqual(['Fecha de inicio', 'Fecha de fin']);
  });

  it('un rango sin ventas lo dice', async () => {
    action.fetch.mockImplementation(async (period: { from: string; to: string }) => ({ success: true, data: { ...STATS, ...period, salesCount: 0 } }));
    render(<StatsPanel />);
    expect(await screen.findByText('No hubo ventas en estas fechas.')).toBeDefined();
  });

  it('si el servidor falla, muestra el motivo', async () => {
    action.fetch.mockResolvedValue({ success: false, code: 'UNEXPECTED', error: 'Ocurrió un error inesperado al procesar el panel de estadísticas.' });
    render(<StatsPanel />);
    expect(await screen.findByText('Ocurrió un error inesperado al procesar el panel de estadísticas.')).toBeDefined();
  });
});

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { StatsPanel } from './stats-panel';

const action = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/features/stats/actions/fetch-workday-stats', () => ({ fetchWorkdayStats: action.fetch }));

const STATS: WorkdayStats = {
  day: '2026-10-25',
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
    action.fetch.mockImplementation(async (day: string) => ({ success: true, data: { ...STATS, day } }));
  });

  it('abre con la jornada de hoy y muestra cada comida con su color, las promos, la ganancia, las ventas y los 4 medios', async () => {
    render(<StatsPanel />);
    expect(await within(await screen.findByRole('region', { name: 'Empanadas' })).findByText('$12.000')).toBeDefined();
    expect(card('Empanadas').className).toContain('bg-group-empanadas');
    expect(within(card('Promos')).getByText('$9.000')).toBeDefined();
    expect(within(card('Ganancia en limpio')).getByText('$20.000')).toBeDefined();
    expect(within(card('Ventas registradas')).getByText('7')).toBeDefined();
    expect(['Efectivo', 'Transferencia', 'Débito', 'Crédito'].map((name) => within(card(name)).getByText(/\$/).textContent)).toEqual(['$20.000', '$10.000', '$5.500', '$6.600']);
    expect(action.fetch).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it('elegir otra jornada la pide al servidor', async () => {
    render(<StatsPanel />);
    fireEvent.change(await screen.findByLabelText('Jornada'), { target: { value: '2026-10-20' } });
    await waitFor(() => expect(action.fetch).toHaveBeenLastCalledWith('2026-10-20'));
  });

  it('una jornada sin ventas lo dice', async () => {
    action.fetch.mockResolvedValue({ success: true, data: { ...STATS, salesCount: 0, day: '2026-10-25' } });
    useStatsStore.setState({ stats: null, isLoaded: false });
    render(<StatsPanel />);
    fireEvent.change(await screen.findByLabelText('Jornada'), { target: { value: '2026-10-25' } });
    expect(await screen.findByText('No hubo ventas en esta jornada.')).toBeDefined();
  });

  it('si el servidor falla, muestra el motivo', async () => {
    action.fetch.mockResolvedValue({ success: false, code: 'UNEXPECTED', error: 'Ocurrió un error inesperado al procesar el/la panel de estadísticas.' });
    render(<StatsPanel />);
    expect(await screen.findByText('Ocurrió un error inesperado al procesar el/la panel de estadísticas.')).toBeDefined();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { fetchSaleHistory } from '@/features/order/actions/fetch-sale-history';
import { saleDef } from '../testing/sale-fixtures';
import { SaleHistoryPanel } from './sale-history-panel';

vi.mock('@/features/order/actions/fetch-sale-history', () => ({ fetchSaleHistory: vi.fn() }));
vi.mock('@/features/order/actions/void-sale', () => ({ voidSaleAction: vi.fn() }));

describe('pantalla Ventas/Pedidos (US-7 CA-1)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'u', username: 'vendedor', role: 'vendedor' }, isAuthenticated: true });
    vi.mocked(fetchSaleHistory).mockReset().mockResolvedValue([]);
  });

  it('"Nuevo pedido" lleva al tablero y ya no existe "Nueva Venta"', async () => {
    render(<SaleHistoryPanel />);
    expect((await screen.findByRole('link', { name: 'Nuevo pedido' })).getAttribute('href')).toBe('/ventas/nueva');
    expect(screen.queryByText('Nueva Venta')).toBeNull();
    expect(screen.getAllByText('No hay ventas que coincidan con los filtros.').length).toBeGreaterThan(0);
  });

  it('lee el historial al entrar y ya no tiene botón "Sincronizar" (US-38)', async () => {
    vi.mocked(fetchSaleHistory).mockResolvedValue([saleDef()]);
    render(<SaleHistoryPanel />);
    await waitFor(() => expect(fetchSaleHistory).toHaveBeenCalledTimes(1));
    expect(screen.queryByTitle('Sincronizar')).toBeNull();
  });
});

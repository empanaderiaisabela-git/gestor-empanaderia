import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { fetchSaleHistory } from '@/features/order/actions/fetch-sale-history';
import { voidSaleAction } from '@/features/order/actions/void-sale';
import { MORNING_SALE, saleDef } from '../testing/sale-fixtures';
import { useSaleHistory } from './use-sale-history';

vi.mock('@/features/order/actions/fetch-sale-history', () => ({ fetchSaleHistory: vi.fn() }));
vi.mock('@/features/order/actions/void-sale', () => ({ voidSaleAction: vi.fn() }));

const SALE = saleDef();

async function loaded() {
  const hook = renderHook(() => useSaleHistory());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('estado de Ventas/Pedidos (US-7)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'u', username: 'admin', role: 'admin' }, isAuthenticated: true });
    vi.mocked(fetchSaleHistory).mockReset().mockResolvedValue([SALE, MORNING_SALE]);
    vi.mocked(voidSaleAction).mockReset();
  });

  it('carga las ventas y las filtra por comprador y por fechas (CA-1)', async () => {
    const { result } = await loaded();
    expect(result.current).toMatchObject({ isAdmin: true, sales: [SALE, MORNING_SALE] });
    act(() => result.current.setFilters({ search: 'marta' }));
    expect(result.current.sales).toEqual([SALE]);
    act(() => result.current.setFilters({ search: '', endDate: '2026-10-24' }));
    expect(result.current.sales).toEqual([MORNING_SALE]);
  });

  it('anular avisa, vuelve a leer el historial y pide recargar el stock (CA-3)', async () => {
    vi.mocked(voidSaleAction).mockResolvedValue({ success: true, message: 'Venta anulada y stock repuesto.' });
    useMenuStore.setState({ isLoaded: true });
    const { result } = await loaded();
    act(() => result.current.setToVoid(SALE));
    vi.mocked(fetchSaleHistory).mockResolvedValue([MORNING_SALE]);
    await act(() => result.current.confirmVoid());
    expect(voidSaleAction).toHaveBeenCalledWith({ saleId: SALE.id });
    expect(result.current).toMatchObject({ toVoid: null, pending: false, notice: { type: 'success', text: 'Venta anulada y stock repuesto.' }, sales: [MORNING_SALE] });
    expect(useMenuStore.getState().isLoaded).toBe(false);
  });

  it('si el servidor rechaza la anulación, muestra el motivo y no recarga', async () => {
    vi.mocked(voidSaleAction).mockResolvedValue({ success: false, code: 'FORBIDDEN', error: 'Solo los administradores pueden realizar esta acción' });
    const { result } = await loaded();
    act(() => result.current.setToVoid(SALE));
    await act(() => result.current.confirmVoid());
    expect(result.current.notice).toEqual({ type: 'error', text: 'Solo los administradores pueden realizar esta acción' });
    expect(fetchSaleHistory).toHaveBeenCalledTimes(1);
  });

  it('sin una venta elegida, confirmar no hace nada', async () => {
    const { result } = await loaded();
    await act(() => result.current.confirmVoid());
    expect(voidSaleAction).not.toHaveBeenCalled();
  });
});

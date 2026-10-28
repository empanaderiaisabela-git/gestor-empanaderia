import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockHistoryModal } from './stock-history-modal';
import { StockLossModal } from './stock-loss-modal';
import type { StockPanelModel } from './use-stock-panel';

const history = vi.hoisted(() => vi.fn());
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: history }));

const PIZZA: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'pizzas', name: 'Muzza', unitCost: 3000, stock: 2.5, price1: 11000, price3: null, price6: null, price12: null, isActive: true, isVisible: false, version: 1, createdAt: '', updatedAt: '' };

function model(overrides: Partial<StockPanelModel>): StockPanelModel {
  const noop = vi.fn(async () => null);
  return { loading: false, items: [], activeItems: [], providers: [], groupPrices: [], search: '', setSearch: vi.fn(), groupFilter: 'todos', setGroupFilter: vi.fn(), dialog: null, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, ...overrides };
}

describe('merma e historial (US-4 CA-3 y CA-4)', () => {
  it('registra media pizza con su motivo', async () => {
    const submitLoss = vi.fn(async () => null);
    render(<StockLossModal model={model({ dialog: { kind: 'loss', item: PIZZA }, submitLoss })} />);
    expect(screen.getByText('Stock actual: 2,5')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Cantidad perdida'), { target: { value: '0,5' } });
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Se quemó' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pérdida' }));
    await waitFor(() => expect(submitLoss).toHaveBeenCalledWith({ menuItemId: PIZZA.id, quantity: 0.5, reason: 'Se quemó' }));
  });

  it('muestra el error del servidor, por ejemplo stock insuficiente', async () => {
    render(<StockLossModal model={model({ dialog: { kind: 'loss', item: PIZZA }, submitLoss: async () => 'No hay stock suficiente de Muzza.' })} />);
    fireEvent.change(screen.getByLabelText('Cantidad perdida'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pérdida' }));
    expect(await screen.findByText('No hay stock suficiente de Muzza.')).toBeDefined();
  });

  it('el historial lista los ingresos con fecha, cantidad, costo, proveedor y usuario', async () => {
    history.mockResolvedValue([{ id: 'e', menuItemId: PIZZA.id, quantity: 4, unitCost: 3000, providerName: 'Molino del Sur', username: 'admin', createdAt: '2026-10-25T15:00:00.000Z' }]);
    render(<StockHistoryModal model={model({ dialog: { kind: 'history', item: PIZZA } })} />);
    expect(await screen.findByText('+4')).toBeDefined();
    expect(screen.getByText('25/10/2026, 12:00')).toBeDefined();
    expect(screen.getByText(/Costo para el local \$3\.000 · Molino del Sur · admin/)).toBeDefined();
  });

  it('sin ingresos lo dice', async () => {
    history.mockResolvedValue([]);
    render(<StockHistoryModal model={model({ dialog: { kind: 'history', item: PIZZA } })} />);
    expect(await screen.findByText('Todavía no hay ingresos de stock para este producto.')).toBeDefined();
  });
});

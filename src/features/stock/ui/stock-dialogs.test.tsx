import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockHistoryModal } from './stock-history-modal';
import { StockLossModal } from './stock-loss-modal';
import { StockPricingModal } from './stock-pricing-modal';
import type { StockPanelModel } from './use-stock-panel';

const history = vi.hoisted(() => vi.fn());
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: history }));

const PREPIZZA: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'pizzas', name: 'Prepizza', unitCost: null, stock: 3, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: true, version: 1, createdAt: '', updatedAt: '' };

const EMPANADA: MenuItemDef = { ...PREPIZZA, isBase: false, id: '22222222-2222-4222-8222-222222222222', group: 'empanadas', name: 'Carne', unitCost: 400, stock: 10, price1: 1200, price3: 3400, price6: 6500, price12: 12000, version: 3 };

function model(overrides: Partial<StockPanelModel>): StockPanelModel {
  const noop = vi.fn(async () => null);
  return { loading: false, items: [], activeItems: [], providers: [], search: '', setSearch: vi.fn(), groupFilter: 'todos', setGroupFilter: vi.fn(), dialog: null, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, submitPricing: noop, ...overrides };
}

describe('Costo y precio (US-28 CA-5)', () => {
  it('abre con los valores actuales y manda los precios del gusto con la casilla de aplicar a todos', async () => {
    const submitPricing = vi.fn(async () => null);
    render(<StockPricingModal model={model({ dialog: { kind: 'pricing', item: EMPANADA }, submitPricing })} />);
    expect(screen.getByLabelText('Costo para el local, por unidad')).toHaveProperty('value', '400');
    fireEvent.change(screen.getByLabelText('Precio de venta, 1 docena'), { target: { value: '13000' } });
    fireEvent.click(screen.getByLabelText('Aplicar este precio a todos los gustos de Empanadas'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submitPricing).toHaveBeenCalledWith({ menuItemId: EMPANADA.id, version: 3, unitCost: 400, prices: { price1: 1200, price3: 3400, price6: 6500, price12: 13000 }, applyToGroup: true }));
  });

  it('no manda si falta un precio y muestra el error del servidor', async () => {
    const submitPricing = vi.fn(async () => 'Los datos en el servidor han cambiado.');
    render(<StockPricingModal model={model({ dialog: { kind: 'pricing', item: { ...EMPANADA, price6: null } }, submitPricing })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Ingresá un precio válido')).toBeDefined();
    expect(submitPricing).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/^Precio de venta, ½ docena/), { target: { value: '6500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Los datos en el servidor han cambiado.')).toBeDefined();
  });
});

describe('merma e historial (US-4 CA-3 y CA-4)', () => {
  it('registra la pérdida de una prepizza con su motivo (US-29 CA-4)', async () => {
    const submitLoss = vi.fn(async () => null);
    render(<StockLossModal model={model({ dialog: { kind: 'loss', item: PREPIZZA }, submitLoss })} />);
    expect(screen.getByText('Stock actual: 3')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Cantidad perdida'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Se quemó' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pérdida' }));
    await waitFor(() => expect(submitLoss).toHaveBeenCalledWith({ menuItemId: PREPIZZA.id, quantity: 1, reason: 'Se quemó' }));
  });

  it('muestra el error del servidor, por ejemplo stock insuficiente', async () => {
    render(<StockLossModal model={model({ dialog: { kind: 'loss', item: PREPIZZA }, submitLoss: async () => 'No hay stock suficiente de Prepizza.' })} />);
    fireEvent.change(screen.getByLabelText('Cantidad perdida'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pérdida' }));
    expect(await screen.findByText('No hay stock suficiente de Prepizza.')).toBeDefined();
  });

  it('el historial lista los ingresos con fecha, cantidad, costo, proveedor y usuario', async () => {
    history.mockResolvedValue([{ id: 'e', menuItemId: EMPANADA.id, quantity: 4, unitCost: 3000, providerName: 'Molino del Sur', username: 'admin', createdAt: '2026-10-25T15:00:00.000Z' }]);
    render(<StockHistoryModal model={model({ dialog: { kind: 'history', item: EMPANADA } })} />);
    expect(await screen.findByText('+4')).toBeDefined();
    expect(screen.getByText('25/10/2026, 12:00')).toBeDefined();
    expect(screen.getByText(/Costo para el local \$3\.000 · Molino del Sur · admin/)).toBeDefined();
  });

  it('sin ingresos lo dice', async () => {
    history.mockResolvedValue([]);
    render(<StockHistoryModal model={model({ dialog: { kind: 'history', item: EMPANADA } })} />);
    expect(await screen.findByText('Todavía no hay ingresos de stock para este producto.')).toBeDefined();
  });
});

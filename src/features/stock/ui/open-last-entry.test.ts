import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { openLastEntry } from './open-last-entry';

const entries = vi.hoisted(() => vi.fn());
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: entries }));

const ITEM: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'empanadas', name: 'Humita', unitCost: 400, stock: 5, price1: 1200, price3: 3400, price6: 6500, price12: 12000, isActive: true, isVisible: false, isBase: false, minStock: 2, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 1, createdAt: '', updatedAt: '' };
const LAST = { id: '22222222-2222-4222-8222-222222222222', menuItemId: ITEM.id, quantity: 12, unitCost: 450, providerId: null, providerName: null, username: 'admin', version: 1, createdAt: '2026-10-31T12:00:00Z' };

describe('lápiz de acceso directo en Stock (US-48, US-70)', () => {
  it('abre la edición del stock con el ingreso más reciente del gusto', async () => {
    entries.mockResolvedValue([LAST, { ...LAST, id: '33333333-3333-4333-8333-333333333333' }]);
    const setDialog = vi.fn();
    await openLastEntry(ITEM, setDialog);
    expect(entries).toHaveBeenCalledWith(ITEM.id);
    expect(setDialog).toHaveBeenCalledWith({ kind: 'edit', item: ITEM, entry: LAST });
  });

  it('sin ingresos, abre igual la edición del stock, sin ingreso (US-70 CA-3)', async () => {
    entries.mockResolvedValue([]);
    const setDialog = vi.fn();
    await openLastEntry(ITEM, setDialog);
    expect(setDialog).toHaveBeenCalledWith({ kind: 'edit', item: ITEM, entry: null });
  });
});

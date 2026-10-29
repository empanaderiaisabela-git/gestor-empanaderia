import { priceColumns } from '@/features/menu/repository/menu-item.repository';
import type { EntryView, StockEntry, StockItem, StockLoss, StockRepository } from '@/features/stock/repository/stock.repository';
import type { StockAuditEntry, StockUnitOfWork } from '@/features/stock/repository/stock-unit-of-work';

type FakeState = { items: StockItem[]; entries: StockEntry[]; losses: StockLoss[]; audits: StockAuditEntry[]; providerNames: Map<string, string>; usernames: Map<string, string>; clock: number };

const tick = (state: FakeState): Date => {
  state.clock += 1;
  return new Date(state.clock * 1000);
};

function viewOf(state: FakeState, entry: StockEntry): EntryView {
  const providerName = entry.providerId ? (state.providerNames.get(entry.providerId) ?? null) : null;
  return { ...entry, providerName, username: state.usernames.get(entry.userId) ?? '?' };
}

export function fakeStockRepository(state: FakeState): StockRepository {
  return {
    lockItem: async (id) => state.items.find((item) => item.id === id) ?? null,
    lockGroup: async (group) => state.items.filter((item) => item.group === group && !item.isBase).sort((a, b) => (a.id < b.id ? -1 : 1)),
    lockBase: async (group) => state.items.find((item) => item.group === group && item.isBase) ?? null,
    saveItem: async ({ id, version }, { stock, unitCost, prices }) => {
      const item = state.items.find((row) => row.id === id && row.version === version);
      if (!item) return null;
      Object.assign(item, { version: version + 1 }, stock === undefined ? {} : { stock: stock.toFixed(1) }, unitCost === undefined ? {} : { unitCost: unitCost.toFixed(2) }, prices ? priceColumns(prices) : {});
      return { ...item };
    },
    insertEntry: async ({ unitCost, ...entry }) => {
      const row: StockEntry = { id: crypto.randomUUID(), ...entry, unitCost: unitCost.toFixed(2), createdAt: tick(state) };
      state.entries.push(row);
      return row;
    },
    insertLoss: async ({ unitCost, quantity, ...loss }) => {
      const row: StockLoss = { id: crypto.randomUUID(), ...loss, quantity: quantity.toFixed(1), unitCost: unitCost.toFixed(2), createdAt: tick(state) };
      state.losses.push(row);
      return row;
    },
    entriesOf: async (menuItemId) =>
      state.entries
        .filter((entry) => entry.menuItemId === menuItemId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((entry) => viewOf(state, entry)),
  };
}

export type FakeStockUnitOfWork = StockUnitOfWork & { state: FakeState; reset(): void };

export function createFakeStockUnitOfWork(): FakeStockUnitOfWork {
  const empty = (): FakeState => ({ items: [], entries: [], losses: [], audits: [], providerNames: new Map(), usernames: new Map(), clock: 0 });
  const state = empty();
  const repository = fakeStockRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ stock: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, empty()),
  };
}

export const fakeStock = createFakeStockUnitOfWork();

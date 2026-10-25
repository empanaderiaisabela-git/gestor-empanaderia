import { type MenuItem, type MenuItemData, type MenuItemRepository, priceColumns } from '@/features/menu/repository/menu-item.repository';
import type { MenuAuditEntry, MenuUnitOfWork } from '@/features/menu/repository/menu-unit-of-work';
import { fakeMenuGroupPriceRepository, type FakeGroupPriceState } from './fake-menu-group-prices';
import { fakeMenuPhotoRepository, type FakePhotoState } from './fake-menu-photos';

type FakeState = FakeGroupPriceState & FakePhotoState & { rows: MenuItem[]; withMovements: Set<string>; audits: MenuAuditEntry[]; clock: number };

const pgError = (code: string, detail: string): Error => Object.assign(new Error(`Failed query (${code})`), { cause: { code, detail } });
const GROUP_ORDER = ['empanadas', 'pizzas', 'sanguches', 'ciabattas', 'coca_cola', 'pepsi'];

function newRow(state: FakeState, { group, name, unitCost, prices }: MenuItemData): MenuItem {
  state.clock += 1;
  const at = new Date(state.clock * 1000);
  const base = { id: crypto.randomUUID(), group, name, unitCost: unitCost.toFixed(2), stock: '0.0', isActive: true, isVisible: false, version: 1 };
  return { ...base, ...priceColumns(prices), createdAt: at, updatedAt: at };
}

function sorted(rows: MenuItem[]): MenuItem[] {
  return [...rows].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.name.localeCompare(b.name));
}

export function fakeMenuItemRepository(state: FakeState): MenuItemRepository {
  const byRef = (id: string, version: number): MenuItem | undefined => state.rows.find((row) => row.id === id && row.version === version);
  return {
    findAll: async () => sorted(state.rows),
    findById: async (id) => state.rows.find((row) => row.id === id) ?? null,
    findByName: async (group, name) => state.rows.find((row) => row.group === group && row.name.toLowerCase() === name.toLowerCase()) ?? null,
    insert: async (data) => {
      if (state.rows.some((row) => row.group === data.group && row.name === data.name)) throw pgError('23505', 'Key (menu_group, name) already exists.');
      const row = newRow(state, data);
      state.rows.push(row);
      return { ...row };
    },
    update: async ({ id, version }, { prices, unitCost, ...rest }) => {
      const row = byRef(id, version);
      if (!row) return null;
      Object.assign(row, rest, prices ? priceColumns(prices) : {}, unitCost === undefined ? {} : { unitCost: unitCost.toFixed(2) });
      Object.assign(row, { version: version + 1, updatedAt: new Date() });
      return { ...row };
    },
    remove: async ({ id, version }) => {
      if (state.withMovements.has(id)) throw pgError('23503', 'Key (id) is still referenced from table "sale_line_items".');
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !(row.id === id && row.version === version));
      return state.rows.length < before;
    },
  };
}

export type FakeMenuUnitOfWork = MenuUnitOfWork & { state: FakeState; reset(): void };

export function createFakeMenuUnitOfWork(): FakeMenuUnitOfWork {
  const empty = (): FakeState => ({ rows: [], groupPrices: [], photos: [], withMovements: new Set(), audits: [], clock: 0 });
  const state = empty();
  const repositories = { items: fakeMenuItemRepository(state), groupPrices: fakeMenuGroupPriceRepository(state), photos: fakeMenuPhotoRepository(state) };
  return {
    state,
    read: repositories,
    run: (work) => work({ ...repositories, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, empty()),
  };
}

export const fakeMenu = createFakeMenuUnitOfWork();

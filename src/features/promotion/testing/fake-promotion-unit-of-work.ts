import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { PromotionComponent } from '@/features/promotion/domain/promotion.schema';
import type { Promotion, PromotionRepository, StoredComponent } from '@/features/promotion/repository/promotion.repository';
import type { PromotionAuditEntry, PromotionUnitOfWork } from '@/features/promotion/repository/promotion-unit-of-work';

type FakeState = { rows: Promotion[]; withSales: Set<string>; audits: PromotionAuditEntry[]; clock: number; menuItems: Map<string, { group: MenuGroup; name: string }> };

const pgError = (code: string, detail: string): Error => Object.assign(new Error(`Failed query (${code})`), { cause: { code, detail } });
const copy = (row: Promotion): Promotion => ({ ...row, components: row.components.map((component) => ({ ...component })) });

function stored(state: FakeState, components: PromotionComponent[]): StoredComponent[] {
  return components.map((component) => {
    const drink = component.menuItemId === null ? null : state.menuItems.get(component.menuItemId);
    if (drink === undefined || (drink && drink.group !== component.group)) throw pgError('23503', 'Key (menu_item_id, menu_group) is not present in table "menu_items".');
    return { ...component, menuItemName: drink?.name ?? null };
  });
}

export function fakePromotionRepository(state: FakeState): PromotionRepository {
  const byRef = (id: string, version: number): Promotion | undefined => state.rows.find((row) => row.id === id && row.version === version);
  return {
    findAll: async () => [...state.rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(copy),
    findById: async (id) => {
      const row = state.rows.find((candidate) => candidate.id === id);
      return row ? copy(row) : null;
    },
    findByName: async (name) => state.rows.find((row) => row.name.toLowerCase() === name.toLowerCase()) ?? null,
    insert: async ({ name, price, components }) => {
      if (state.rows.some((row) => row.name === name)) throw pgError('23505', 'Key (name) already exists.');
      state.clock += 1;
      const at = new Date(state.clock * 1000);
      const row: Promotion = { id: crypto.randomUUID(), name, price: price.toFixed(2), components: stored(state, components), isActive: true, version: 1, createdAt: at, updatedAt: at };
      state.rows.push(row);
      return copy(row);
    },
    update: async ({ id, version }, { price, components, ...changes }) => {
      const row = byRef(id, version);
      if (!row) return null;
      const parts = components ? { components: stored(state, components) } : {};
      Object.assign(row, changes, parts, price === undefined ? {} : { price: price.toFixed(2) }, { version: version + 1, updatedAt: new Date() });
      return copy(row);
    },
    remove: async ({ id, version }) => {
      if (state.withSales.has(id)) throw pgError('23503', 'Key (id) is still referenced from table "sale_lines".');
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !(row.id === id && row.version === version));
      return state.rows.length < before;
    },
  };
}

export type FakePromotionUnitOfWork = PromotionUnitOfWork & { state: FakeState; reset(): void };

export function createFakePromotionUnitOfWork(): FakePromotionUnitOfWork {
  const state: FakeState = { rows: [], withSales: new Set(), audits: [], clock: 0, menuItems: new Map() };
  const repository = fakePromotionRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ promotions: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, { rows: [], withSales: new Set(), audits: [], clock: 0, menuItems: new Map() }),
  };
}

export const fakePromotions = createFakePromotionUnitOfWork();

import type { Promotion, PromotionRepository } from '@/features/promotion/repository/promotion.repository';
import type { PromotionAuditEntry, PromotionUnitOfWork } from '@/features/promotion/repository/promotion-unit-of-work';

type FakeState = { rows: Promotion[]; audits: PromotionAuditEntry[]; clock: number };

const pgError = (code: string, detail: string): Error => Object.assign(new Error(`Failed query (${code})`), { cause: { code, detail } });
const copy = (row: Promotion): Promotion => ({ ...row, components: row.components.map((component) => ({ ...component })) });

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
      const row: Promotion = { id: crypto.randomUUID(), name, price: price.toFixed(2), components, isActive: true, version: 1, createdAt: at, updatedAt: at };
      state.rows.push(row);
      return copy(row);
    },
    update: async ({ id, version }, { price, ...changes }) => {
      const row = byRef(id, version);
      if (!row) return null;
      Object.assign(row, changes, price === undefined ? {} : { price: price.toFixed(2) }, { version: version + 1, updatedAt: new Date() });
      return copy(row);
    },
    remove: async ({ id, version }) => {
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !(row.id === id && row.version === version));
      return state.rows.length < before;
    },
  };
}

export type FakePromotionUnitOfWork = PromotionUnitOfWork & { state: FakeState; reset(): void };

export function createFakePromotionUnitOfWork(): FakePromotionUnitOfWork {
  const state: FakeState = { rows: [], audits: [], clock: 0 };
  const repository = fakePromotionRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ promotions: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, { rows: [], audits: [], clock: 0 }),
  };
}

export const fakePromotions = createFakePromotionUnitOfWork();

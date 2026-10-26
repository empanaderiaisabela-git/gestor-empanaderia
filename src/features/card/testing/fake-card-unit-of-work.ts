import type { CardPlan } from '@/features/card/domain/card.schema';
import type { Card, CardRepository, StoredPlan } from '@/features/card/repository/card.repository';
import type { CardAuditEntry, CardUnitOfWork } from '@/features/card/repository/card-unit-of-work';

type FakeState = { rows: Card[]; withPayments: Set<string>; audits: CardAuditEntry[]; clock: number };

const pgError = (code: string, detail: string): Error => Object.assign(new Error(`Failed query (${code})`), { cause: { code, detail } });
const copy = (row: Card): Card => ({ ...row, plans: row.plans.map((plan) => ({ ...plan })) });
const stored = (plans: CardPlan[]): StoredPlan[] => [...plans].sort((a, b) => a.installments - b.installments).map(({ installments, surchargePct }) => ({ installments, surchargePct: surchargePct.toFixed(2) }));

export function fakeCardRepository(state: FakeState): CardRepository {
  const byRef = (id: string, version: number): Card | undefined => state.rows.find((row) => row.id === id && row.version === version);
  return {
    findAll: async () => [...state.rows].sort((a, b) => a.name.localeCompare(b.name)).map(copy),
    findById: async (id) => {
      const row = state.rows.find((candidate) => candidate.id === id);
      return row ? copy(row) : null;
    },
    findByName: async (name) => state.rows.find((row) => row.name.toLowerCase() === name.toLowerCase()) ?? null,
    insert: async ({ name, plans }) => {
      if (state.rows.some((row) => row.name === name)) throw pgError('23505', 'Key (name) already exists.');
      state.clock += 1;
      const at = new Date(state.clock * 1000);
      const row: Card = { id: crypto.randomUUID(), name, plans: stored(plans), isActive: true, version: 1, createdAt: at, updatedAt: at };
      state.rows.push(row);
      return copy(row);
    },
    update: async ({ id, version }, { plans, ...changes }) => {
      const row = byRef(id, version);
      if (!row) return null;
      Object.assign(row, changes, plans ? { plans: stored(plans) } : {}, { version: version + 1, updatedAt: new Date() });
      return copy(row);
    },
    remove: async ({ id, version }) => {
      if (state.withPayments.has(id)) throw pgError('23503', 'Key (id) is still referenced from table "sale_payments".');
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !(row.id === id && row.version === version));
      return state.rows.length < before;
    },
  };
}

export type FakeCardUnitOfWork = CardUnitOfWork & { state: FakeState; reset(): void };

export function createFakeCardUnitOfWork(): FakeCardUnitOfWork {
  const state: FakeState = { rows: [], withPayments: new Set(), audits: [], clock: 0 };
  const repository = fakeCardRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ cards: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, { rows: [], withPayments: new Set(), audits: [], clock: 0 }),
  };
}

export const fakeCards = createFakeCardUnitOfWork();

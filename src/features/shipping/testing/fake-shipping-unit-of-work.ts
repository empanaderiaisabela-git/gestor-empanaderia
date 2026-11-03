import type { ShippingInput } from '@/features/shipping/domain/shipping.schema';
import type { Shipping, ShippingChanges, ShippingRepository } from '@/features/shipping/repository/shipping.repository';
import type { ShippingAuditEntry, ShippingUnitOfWork } from '@/features/shipping/repository/shipping-unit-of-work';

type FakeState = { rows: Shipping[]; withSales: Set<string>; audits: ShippingAuditEntry[]; clock: number };

const pgError = (code: string, detail: string): Error => Object.assign(new Error(`Failed query (${code})`), { cause: { code, detail } });
const money = (amount: number | undefined): Partial<Shipping> => (amount === undefined ? {} : { amount: amount.toFixed(2) });

function newRow(state: FakeState, { amount, ...input }: ShippingInput): Shipping {
  state.clock += 1;
  const at = new Date(state.clock * 1000);
  return { id: crypto.randomUUID(), ...input, amount: amount.toFixed(2), isActive: true, version: 1, createdAt: at, updatedAt: at };
}

function apply(row: Shipping, { amount, ...changes }: ShippingChanges, version: number): void {
  Object.assign(row, changes, money(amount), { version: version + 1, updatedAt: new Date() });
}

export function fakeShippingRepository(state: FakeState): ShippingRepository {
  const byRef = (id: string, version: number): Shipping | undefined => state.rows.find((row) => row.id === id && row.version === version);
  return {
    findAll: async () => [...state.rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    findById: async (id) => state.rows.find((row) => row.id === id) ?? null,
    findByTitle: async (title) => state.rows.find((row) => row.title.toLowerCase() === title.toLowerCase()) ?? null,
    insert: async (input) => {
      if (state.rows.some((row) => row.title === input.title)) throw pgError('23505', 'Key (title) already exists.');
      const row = newRow(state, input);
      state.rows.push(row);
      return { ...row };
    },
    update: async ({ id, version }, changes) => {
      const row = byRef(id, version);
      if (!row) return null;
      apply(row, changes, version);
      return { ...row };
    },
    remove: async ({ id, version }) => {
      if (state.withSales.has(id)) throw pgError('23503', 'Key (id) is still referenced from table "sales".');
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !(row.id === id && row.version === version));
      return state.rows.length < before;
    },
    hasSales: async (id) => state.withSales.has(id),
  };
}

export type FakeShippingUnitOfWork = ShippingUnitOfWork & { state: FakeState; reset(): void };

export function createFakeShippingUnitOfWork(): FakeShippingUnitOfWork {
  const state: FakeState = { rows: [], withSales: new Set(), audits: [], clock: 0 };
  const repository = fakeShippingRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ shippings: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, { rows: [], withSales: new Set(), audits: [], clock: 0 }),
  };
}

export const fakeShippings = createFakeShippingUnitOfWork();

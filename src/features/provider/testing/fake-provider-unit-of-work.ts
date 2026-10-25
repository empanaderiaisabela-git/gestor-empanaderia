import type { ProviderInput } from '@/features/provider/domain/provider.schema';
import type { Provider, ProviderRepository } from '@/features/provider/repository/provider.repository';
import type { ProviderAuditEntry, ProviderUnitOfWork } from '@/features/provider/repository/provider-unit-of-work';

type FakeState = { rows: Provider[]; withProducts: Set<string>; audits: ProviderAuditEntry[]; clock: number };

const pgError = (code: string, detail: string): Error => Object.assign(new Error(`Failed query (${code})`), { cause: { code, detail } });

function newRow(state: FakeState, input: ProviderInput): Provider {
  state.clock += 1;
  const at = new Date(state.clock * 1000);
  return { id: crypto.randomUUID(), ...input, isActive: true, version: 1, createdAt: at, updatedAt: at };
}

export function fakeProviderRepository(state: FakeState): ProviderRepository {
  const byRef = (id: string, version: number): Provider | undefined => state.rows.find((row) => row.id === id && row.version === version);
  return {
    findAll: async () => [...state.rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    findById: async (id) => state.rows.find((row) => row.id === id) ?? null,
    findByName: async (name) => state.rows.find((row) => row.name.toLowerCase() === name.toLowerCase()) ?? null,
    insert: async (input) => {
      if (state.rows.some((row) => row.name === input.name)) throw pgError('23505', 'Key (name) already exists.');
      const row = newRow(state, input);
      state.rows.push(row);
      return row;
    },
    update: async ({ id, version }, changes) => {
      const row = byRef(id, version);
      if (!row) return null;
      Object.assign(row, changes, { version: version + 1, updatedAt: new Date() });
      return { ...row };
    },
    remove: async ({ id, version }) => {
      if (state.withProducts.has(id)) throw pgError('23503', 'Key (id) is still referenced from table "products".');
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !(row.id === id && row.version === version));
      return state.rows.length < before;
    },
    hasProducts: async (id) => state.withProducts.has(id),
  };
}

export type FakeProviderUnitOfWork = ProviderUnitOfWork & { state: FakeState; reset(): void };

export function createFakeProviderUnitOfWork(): FakeProviderUnitOfWork {
  const state: FakeState = { rows: [], withProducts: new Set(), audits: [], clock: 0 };
  const repository = fakeProviderRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ providers: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, { rows: [], withProducts: new Set(), audits: [], clock: 0 }),
  };
}

export const fakeProviders = createFakeProviderUnitOfWork();

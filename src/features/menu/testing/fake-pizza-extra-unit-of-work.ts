import type { PizzaExtra, PizzaExtraAudit, PizzaExtraRepository, PizzaExtraUnitOfWork } from '@/features/menu/repository/pizza-extra.repository';

type FakeState = { ham: PizzaExtra | null; audits: PizzaExtraAudit[] };
export type FakePizzaExtraUnitOfWork = PizzaExtraUnitOfWork & { state: FakeState; reset(): void };

export function fakePizzaExtraRepository(state: Pick<FakeState, 'ham'>): PizzaExtraRepository {
  return {
    findHam: async () => (state.ham ? { ...state.ham } : null),
    saveHam: async ({ price, version }) => {
      if ((state.ham?.version ?? 0) !== version) return null;
      state.ham = { code: 'jamon', price: price.toFixed(2), version: version + 1, updatedAt: new Date(0) };
      return { ...state.ham };
    },
  };
}

export function createFakePizzaExtraUnitOfWork(): FakePizzaExtraUnitOfWork {
  const state: FakeState = { ham: null, audits: [] };
  const repository = fakePizzaExtraRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ extras: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, { ham: null, audits: [] }),
  };
}

export const fakePizzaExtras = createFakePizzaExtraUnitOfWork();

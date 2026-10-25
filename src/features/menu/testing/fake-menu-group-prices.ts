import type { MenuGroupPrice, MenuGroupPriceRepository } from '@/features/menu/repository/menu-group-price.repository';
import { priceColumns } from '@/features/menu/repository/menu-item.repository';

export type FakeGroupPriceState = { groupPrices: MenuGroupPrice[] };

export function fakeMenuGroupPriceRepository(state: FakeGroupPriceState): MenuGroupPriceRepository {
  return {
    findAll: async () => [...state.groupPrices].sort((a, b) => a.group.localeCompare(b.group)),
    save: async ({ group, prices, version }) => {
      const current = state.groupPrices.find((row) => row.group === group);
      if (version === 0 ? current : current?.version !== version) return null;
      const row: MenuGroupPrice = { group, ...priceColumns(prices), price1: prices.price1.toFixed(2), version: version + 1, updatedAt: new Date() };
      state.groupPrices = [...state.groupPrices.filter((existing) => existing.group !== group), row];
      return { ...row };
    },
  };
}

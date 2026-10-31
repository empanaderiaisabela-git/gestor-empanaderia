import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { sameFamily } from '@/features/menu/domain/drink';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { fetchStockEntries } from '@/features/stock/actions/fetch-stock-entries';
import type { EntryValues } from './stock-forms';

type FamilyProvider = { items: MenuItemDef[]; menuItemId: string; setValues: Dispatch<SetStateAction<EntryValues>>; enabled: boolean };

export function useFamilyProvider({ items, menuItemId, setValues, enabled }: FamilyProvider): void {
  const item = items.find((candidate) => candidate.id === menuItemId);
  const familyIds = item?.drinkName ? items.filter((other) => sameFamily(other, item)).map((other) => other.id).join(',') : '';
  useEffect(() => {
    if (!enabled || familyIds === '') return;
    Promise.all(familyIds.split(',').map((id) => fetchStockEntries(id))).then((lists) => {
      const [latest] = lists.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (latest?.providerId) setValues((current) => (current.menuItemId === menuItemId && current.providerId === '' ? { ...current, providerId: latest.providerId ?? '' } : current));
    });
  }, [enabled, familyIds, menuItemId, setValues]);
}

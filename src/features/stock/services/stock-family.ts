import type { MenuPrices } from '@/features/menu/domain/menu-prices';
import type { StockItem } from '@/features/stock/repository/stock.repository';
import type { StockScope } from '@/features/stock/repository/stock-unit-of-work';
import { saved } from './stock-locks';

export type FamilyChange = { unitCost?: number; prices?: MenuPrices };

export async function familyOf({ stock }: StockScope, item: StockItem): Promise<StockItem[]> {
  return (await stock.lockFamily(item)).filter((other) => other.id !== item.id);
}

export function inherited(item: StockItem, family: StockItem[]): StockItem {
  const source = family.find((other) => other.price1 !== null);
  if (!source || (item.price1 !== null && item.unitCost !== null)) return item;
  return { ...item, unitCost: item.unitCost ?? source.unitCost, price1: item.price1 ?? source.price1 };
}

export function inheritedPrices(item: StockItem, current: StockItem): MenuPrices | undefined {
  return item.price1 === null && current.price1 !== null ? { price1: Number(current.price1) } : undefined;
}

export async function shareWithFamily({ stock }: StockScope, family: StockItem[], change: FamilyChange): Promise<void> {
  if (change.unitCost === undefined && !change.prices) return;
  for (const other of family) saved(await stock.saveItem(other, change));
}

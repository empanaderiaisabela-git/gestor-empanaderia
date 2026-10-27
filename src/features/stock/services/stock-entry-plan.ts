import { AppError } from '@/lib/errors';
import { isPricedByGroup } from '@/features/menu/domain/menu-groups';
import { type MenuPrices, priceIssues } from '@/features/menu/domain/menu-prices';
import type { GroupPriceChange } from '@/features/menu/repository/menu-group-price.repository';
import type { StockEntryInput } from '@/features/stock/domain/stock.schema';
import type { StockItem } from '@/features/stock/repository/stock.repository';
import type { StockScope } from '@/features/stock/repository/stock-unit-of-work';

export type EntryPlan = { unitCost: number; itemPrices?: MenuPrices; groupChange?: GroupPriceChange };

function costOf(item: StockItem, input: StockEntryInput): number {
  const cost = input.unitCost ?? (item.unitCost === null ? null : Number(item.unitCost));
  if (cost === null) throw new AppError('MISSING_COST');
  return cost;
}

async function groupPlan({ groupPrices }: StockScope, group: GroupPriceChange['group'], prices: MenuPrices | undefined): Promise<GroupPriceChange | undefined> {
  const row = (await groupPrices.findAll()).find((existing) => existing.group === group);
  if (prices) return { group, prices, version: row?.version ?? 0 };
  if (!row) throw new AppError('MISSING_PRICE');
  return undefined;
}

export async function planEntry(scope: StockScope, item: StockItem, input: StockEntryInput): Promise<EntryPlan> {
  const unitCost = costOf(item, input);
  const { prices } = input;
  if (prices && priceIssues(item.group, prices).length > 0) throw new AppError('VALIDATION');
  if (isPricedByGroup(item.group)) return { unitCost, groupChange: await groupPlan(scope, item.group, prices) };
  if (!prices && item.price1 === null) throw new AppError('MISSING_PRICE');
  return { unitCost, itemPrices: prices };
}

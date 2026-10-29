import { AppError } from '@/lib/errors';
import { priceIssues } from '@/features/menu/domain/menu-prices';
import type { StockPricingInput } from '@/features/stock/domain/stock.schema';
import type { StockItem } from '@/features/stock/repository/stock.repository';
import type { StockScope } from '@/features/stock/repository/stock-unit-of-work';

type Caller = { id: string };
export type PricingResult = { item: StockItem; applied: number };

async function copyToGroup({ stock }: StockScope, item: StockItem, input: StockPricingInput): Promise<number> {
  if (!input.applyToGroup) return 0;
  const others = (await stock.lockGroup(item.group)).filter((other) => other.id !== item.id);
  for (const other of others) {
    if (!(await stock.saveItem(other, { prices: input.prices }))) throw new AppError('STALE_VERSION');
  }
  return others.length;
}

export async function setPricing(scope: StockScope, caller: Caller, input: StockPricingInput): Promise<PricingResult> {
  const current = await scope.stock.lockItem(input.menuItemId);
  if (!current) throw new AppError('NOT_FOUND', { entity: 'el producto' });
  if (current.isBase || priceIssues(current.group, input.prices).length > 0) throw new AppError('VALIDATION');
  const item = await scope.stock.saveItem({ id: current.id, version: input.version }, { unitCost: input.unitCost, prices: input.prices });
  if (!item) throw new AppError('STALE_VERSION');
  const applied = await copyToGroup(scope, item, input);
  const detail = { name: item.name, unitCost: input.unitCost, prices: input.prices, appliedTo: applied };
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: item.id, detail });
  return { item, applied };
}

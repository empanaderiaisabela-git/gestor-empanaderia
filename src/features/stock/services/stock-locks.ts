import { AppError } from '@/lib/errors';
import type { StockItem } from '@/features/stock/repository/stock.repository';
import type { StockScope } from '@/features/stock/repository/stock-unit-of-work';

export async function lockedItem({ stock }: StockScope, id: string): Promise<StockItem> {
  const item = await stock.lockItem(id);
  if (!item) throw new AppError('NOT_FOUND', { entity: 'el producto' });
  return item;
}

export function saved<T>(row: T | null): T {
  if (!row) throw new AppError('STALE_VERSION');
  return row;
}

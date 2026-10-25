import { AppError } from '@/lib/errors';
import type { SaleView, SoldItem } from '@/features/order/repository/sale-history.repository';
import { drizzleSaleHistoryUnitOfWork, type SaleHistoryScope, type SaleHistoryUnitOfWork } from '@/features/order/repository/sale-history-unit-of-work';

type Caller = { id: string };

export type SaleHistoryService = {
  list(): Promise<SaleView[]>;
  voidSale(caller: Caller, saleId: string): Promise<SaleView>;
};

function soldTotals(items: SoldItem[]): [string, number][] {
  const totals = new Map<string, number>();
  for (const { menuItemId, units } of items) totals.set(menuItemId, (totals.get(menuItemId) ?? 0) + units);
  return [...totals].sort(([a], [b]) => a.localeCompare(b));
}

async function restock({ stock }: SaleHistoryScope, sold: [string, number][]): Promise<void> {
  for (const [id, units] of sold) {
    const item = await stock.lockItem(id);
    if (!item) throw new AppError('NOT_FOUND', { entity: 'producto' });
    const saved = await stock.saveItem(item, { stock: Number(item.stock) + units });
    if (!saved) throw new AppError('STALE_VERSION');
  }
}

async function voidSale(scope: SaleHistoryScope, caller: Caller, saleId: string): Promise<SaleView> {
  const sale = await scope.history.lockSale(saleId);
  if (!sale) throw new AppError('NOT_FOUND', { entity: 'venta' });
  await restock(scope, soldTotals(await scope.history.soldItems(saleId)));
  await scope.history.deleteSale(saleId);
  const payments = sale.payments.map(({ type, amount }) => ({ type, amount: Number(amount) }));
  const detail = { total: Number(sale.total), buyerName: sale.buyerName, vendorName: sale.vendorName, lines: sale.lines.map((line) => line.description), payments, note: 'Venta anulada. Stock repuesto.' };
  await scope.audit({ userId: caller.id, action: 'ELIMINAR', entity: 'SALE', entityId: saleId, detail });
  return sale;
}

export function createSaleHistoryService({ unitOfWork }: { unitOfWork: SaleHistoryUnitOfWork }): SaleHistoryService {
  return {
    list: () => unitOfWork.read.list(),
    voidSale: (caller, saleId) => unitOfWork.run((scope) => voidSale(scope, caller, saleId)),
  };
}

export const saleHistoryService = createSaleHistoryService({ unitOfWork: drizzleSaleHistoryUnitOfWork });

import { db } from '@/lib/db';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { salePayments, sales } from '@/lib/db/schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { Payment } from '@/features/order/domain/order-validation';

export type NewSale = { vendorId: string; buyerName: string | null; total: number; discountAmount: number; discountPercentage: number };
export type NewSaleItem = { menuItemId: string; units: number; unitCost: number };
export type NewSaleLine = { group: MenuGroup; presentationKey: string; quantity: number; unitPrice: number; subtotal: number; description: string; items: NewSaleItem[] };

export type SaleWriter = {
  insertSale(sale: NewSale): Promise<string>;
  insertLine(saleId: string, line: NewSaleLine): Promise<string>;
  insertPayments(saleId: string, payments: Payment[]): Promise<void>;
};

type Executor = typeof db | DbTransaction;

const money = (value: number): string => value.toFixed(2);

export function drizzleSaleWriter(executor: Executor = db): SaleWriter {
  return {
    insertSale: async ({ total, discountAmount, discountPercentage, ...sale }) => {
      const [row] = await executor
        .insert(sales)
        .values({ ...sale, total: money(total), discountAmount: money(discountAmount), discountPercentage: money(discountPercentage) })
        .returning({ id: sales.id });
      return row.id;
    },
    insertLine: async (saleId, { items, unitPrice, subtotal, ...line }) => {
      const [row] = await executor
        .insert(saleLines)
        .values({ ...line, saleId, unitPrice: money(unitPrice), subtotal: money(subtotal) })
        .returning({ id: saleLines.id });
      await executor.insert(saleLineItems).values(items.map(({ menuItemId, units, unitCost }) => ({ saleLineId: row.id, menuItemId, units: units.toFixed(1), unitCost: money(unitCost) })));
      return row.id;
    },
    insertPayments: async (saleId, payments) => {
      await executor.insert(salePayments).values(payments.map(({ type, amount }) => ({ saleId, type, amount: money(amount) })));
    },
  };
}

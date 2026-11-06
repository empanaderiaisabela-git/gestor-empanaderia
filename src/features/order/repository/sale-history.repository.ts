import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { cards } from '@/lib/db/card-schema';
import { menuItems } from '@/lib/db/menu-schema';
import { promotions } from '@/lib/db/promotion-schema';
import { salePayments, sales, users } from '@/lib/db/schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { PaymentType } from '@/features/order/domain/order-validation';

export type SaleItemView = { name: string; units: string };
export type SaleLineView = { group: MenuGroup | null; presentationKey: string | null; promotionId: string | null; promotionName: string | null; quantity: number; unitPrice: string; subtotal: string; description: string; items: SaleItemView[] };
export type SalePaymentView = { type: PaymentType; amount: string; cardName: string | null; installments: number | null; surchargeAmount: string | null };
export type SaleView = { id: string; orderNumber: number; createdAt: Date; buyerName: string | null; buyerPhone: string | null; buyerAddress: string | null; vendorName: string; total: string; discountAmount: string; discountPercentage: string; shippingTitle: string | null; shippingAmount: string; lines: SaleLineView[]; payments: SalePaymentView[] };
export type SoldItem = { menuItemId: string; units: number };

export type SaleHistoryRepository = {
  list(): Promise<SaleView[]>;
  lockSale(id: string): Promise<SaleView | null>;
  soldItems(saleId: string): Promise<SoldItem[]>;
  deleteSale(saleId: string): Promise<void>;
};

type Executor = typeof db | DbTransaction;
type SaleRow = Omit<SaleView, 'lines' | 'payments'>;

const HISTORY_LIMIT = 1000;

const SALE_COLUMNS = { id: sales.id, orderNumber: sales.orderNumber, createdAt: sales.createdAt, buyerName: sales.buyerName, buyerPhone: sales.buyerPhone, buyerAddress: sales.buyerAddress, vendorName: users.username, total: sales.total, discountAmount: sales.discountAmount, discountPercentage: sales.discountPercentage, shippingTitle: sales.shippingTitle, shippingAmount: sales.shippingAmount };
const LINE_COLUMNS = { id: saleLines.id, promotionName: promotions.name, group: saleLines.group, presentationKey: saleLines.presentationKey, promotionId: saleLines.promotionId, quantity: saleLines.quantity, unitPrice: saleLines.unitPrice, subtotal: saleLines.subtotal, description: saleLines.description };

const PAYMENT_COLUMNS = { type: salePayments.type, amount: salePayments.amount, cardName: cards.name, installments: salePayments.installments, surchargeAmount: salePayments.surchargeAmount };

const hasLines = (executor: Executor) => inArray(sales.id, executor.select({ id: saleLines.saleId }).from(saleLines));

async function withDetails(executor: Executor, rows: SaleRow[]): Promise<SaleView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const lines = await executor.select({ saleId: saleLines.saleId, line: LINE_COLUMNS }).from(saleLines).leftJoin(promotions, eq(saleLines.promotionId, promotions.id)).where(inArray(saleLines.saleId, ids)).orderBy(asc(saleLines.position));
  const items = await executor.select({ lineId: saleLineItems.saleLineId, name: menuItems.name, units: saleLineItems.units }).from(saleLineItems).innerJoin(menuItems, eq(saleLineItems.menuItemId, menuItems.id)).innerJoin(saleLines, eq(saleLineItems.saleLineId, saleLines.id)).where(inArray(saleLines.saleId, ids)).orderBy(asc(saleLineItems.id));
  const itemsOf = (lineId: string): SaleItemView[] => items.filter((item) => item.lineId === lineId).map(({ name, units }) => ({ name, units }));
  const payments = await executor
    .select({ saleId: salePayments.saleId, payment: PAYMENT_COLUMNS })
    .from(salePayments)
    .leftJoin(cards, eq(salePayments.cardId, cards.id))
    .where(inArray(salePayments.saleId, ids))
    .orderBy(asc(salePayments.createdAt));
  return rows.map((row) => ({
    ...row,
    lines: lines.filter(({ saleId }) => saleId === row.id).map(({ line: { id, ...line } }) => ({ ...line, items: itemsOf(id) })),
    payments: payments.filter(({ saleId }) => saleId === row.id).map(({ payment }) => payment),
  }));
}

export function drizzleSaleHistoryRepository(executor: Executor = db): SaleHistoryRepository {
  const select = () => executor.select(SALE_COLUMNS).from(sales).innerJoin(users, eq(sales.vendorId, users.id));
  return {
    list: async () => withDetails(executor, await select().where(hasLines(executor)).orderBy(desc(sales.createdAt)).limit(HISTORY_LIMIT)),
    lockSale: async (id) => {
      const locked = await executor.select({ id: sales.id }).from(sales).where(and(eq(sales.id, id), hasLines(executor))).for('update');
      if (locked.length === 0) return null;
      const [sale] = await withDetails(executor, await select().where(eq(sales.id, id)));
      return sale ?? null;
    },
    soldItems: async (saleId) => {
      const rows = await executor
        .select({ menuItemId: saleLineItems.menuItemId, units: saleLineItems.units })
        .from(saleLineItems)
        .innerJoin(saleLines, eq(saleLineItems.saleLineId, saleLines.id))
        .where(eq(saleLines.saleId, saleId));
      return rows.map(({ menuItemId, units }) => ({ menuItemId, units: Number(units) }));
    },
    deleteSale: async (saleId) => {
      await executor.delete(salePayments).where(eq(salePayments.saleId, saleId));
      await executor.delete(sales).where(eq(sales.id, saleId));
    },
  };
}
